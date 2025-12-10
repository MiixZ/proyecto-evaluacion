import mysql from 'mysql2/promise';
import config from './environment.js';
import { logger } from '@utils/logger.js';

let pool: mysql.Pool | null = null;

export async function initializeDatabase(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('✓ Conexión a base de datos establecida correctamente');
    return pool;
  } catch (error) {
    logger.error('✗ Error al conectar a la base de datos', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Conexión a base de datos cerrada');
  }
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  return pool;
}
