import mysql from 'mysql2/promise';
import config from './environment';
import { logger } from '@utils/logger';

/**
 * Interfaz para conexión con retry tracking
 */
interface PoolWithRetry extends mysql.Pool {
  _initialized?: boolean;
}

let pool: PoolWithRetry | null = null;

/**
 * Delay helper para reintentos exponenciales
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Evita thundering herd si múltiples conexiones fallan
 */
function getRetryDelayMs(attempt: number, baseDelay: number): number {
  // Exponencial: 1000ms, 2000ms, 4000ms, 8000ms, 16000ms
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Jitter: ±25%
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  return exponentialDelay + jitter;
}

/**
 * Intenta ping con reintentos
 */
async function testConnectionWithRetry(): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.database.maxRetries; attempt++) {
    try {
      const connection = await pool!.getConnection();

      // Timeout para el ping
      const pingPromise = connection.ping();
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Ping timeout después de ${config.database.queryTimeoutMs}ms`
              )
            ),
          config.database.queryTimeoutMs
        )
      );

      await Promise.race([pingPromise, timeoutPromise]);
      connection.release();

      logger.info(
        `✓ Conexión a base de datos verificada (intento ${attempt + 1})`
      );
      return;
    } catch (error) {
      lastError = error as Error;

      if (attempt < config.database.maxRetries - 1) {
        const delayMs = getRetryDelayMs(attempt, config.database.retryDelayMs);
        logger.warn(
          `⚠ Intento ${attempt + 1}/${config.database.maxRetries} fallido. ` +
            `Reintentando en ${delayMs.toFixed(0)}ms...`,
          { error: lastError.message }
        );
        await delay(delayMs);
      }
    }
  }

  throw new Error(
    `No se pudo conectar a la base de datos después de ${config.database.maxRetries} intentos. ` +
      `Último error: ${lastError?.message || 'Desconocido'}`
  );
}

/**
 * Inicializa el pool de conexiones MySQL con reintentos
 */
export async function initializeDatabase(): Promise<mysql.Pool> {
  // Si ya existe, retornar
  if (pool && pool._initialized) {
    logger.debug('Pool de base de datos ya inicializado');

    return pool;
  }

  try {
    logger.info('Inicializando conexión a base de datos...');
    logger.debug('Configuración DB:', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      connectionLimit: config.database.connectionLimit,
      queryTimeout: config.database.queryTimeoutMs,
    });

    // Crear pool
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: config.database.waitForConnections,
      connectionLimit: config.database.connectionLimit,
      queueLimit: config.database.queueLimit,
      enableKeepAlive: config.database.enableKeepAlive,
      keepAliveInitialDelay: config.database.keepAliveInitialDelay,
    }) as PoolWithRetry;

    pool.on('connection', () => {
      logger.debug('Nueva conexión establecida al pool');
    });

    pool.on('release', () => {
      logger.debug('Conexión liberada al pool');
    });

    pool.on('enqueue', () => {
      logger.warn('Conexión en cola (pool lleno)');
    });

    await testConnectionWithRetry();

    pool._initialized = true;

    logger.info(
      `Base de datos inicializada correctamente ` +
        `(Pool: ${config.database.connectionLimit} conexiones)`
    );

    return pool;
  } catch (error) {
    logger.error('Error al conectar a la base de datos', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      logger.info('Cerrando conexión a base de datos...');
      await pool.end();
      pool = null;
      logger.info('Conexión a base de datos cerrada correctamente');
    } catch (error) {
      logger.error('Error al cerrar la conexión a base de datos', error);
      throw error;
    }
  }
}

/**
 * Obtiene el pool de conexiones
 * Lanza error si no ha sido inicializado
 */
export function getPool(): mysql.Pool {
  if (!pool || !pool._initialized) {
    throw new Error('Database pool not initialized.');
  }

  return pool;
}

/**
 * Helper para ejecutar queries con manejo de errores
 * Útil para que los modelos lo usen
 */
export async function executeQuery<T = any>(
  query: string,
  values?: any[]
): Promise<T> {
  const startTime = Date.now();

  try {
    const connection = await getPool().getConnection();

    try {
      const [result] = await connection.execute(query, values);
      const duration = Date.now() - startTime;

      logger.debug(`Query ejecutada en ${duration}ms`, {
        query: query.substring(0, 100),
        duration,
      });

      return result as T;
    } finally {
      connection.release();
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Query falló después de ${duration}ms`, {
      query: query.substring(0, 100),
      error,
    });

    throw error;
  }
}

/**
 * Helper para transacciones
 */
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
