import { z } from 'zod';
import { logger } from '@utils/logger';

/**
 * Esquema de validación para variables de entorno
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),

  // JWT (Local)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_EXPIRY: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3001')
    .transform((val) => {
      return val.split(',').map((origin) => origin.trim());
    }),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Database Pooling
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_QUEUE_LIMIT: z.coerce.number().int().nonnegative().default(0),
  DB_WAIT_FOR_CONNECTIONS: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('true'),
  DB_ENABLE_KEEP_ALIVE: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('true'),
  DB_KEEP_ALIVE_INITIAL_DELAY: z.coerce.number().int().nonnegative().default(0),

  // Connection Retry Strategy
  DB_MAX_RETRIES: z.coerce.number().int().positive().default(5),
  DB_RETRY_DELAY_MS: z.coerce.number().int().positive().default(1000),
  DB_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  EXECUTION_ENGINE_URL: z.string().url().default('http://localhost:3001'),
  EXECUTION_ENGINE_API_KEY: z.string().optional(),

  // SMTP (Email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('"Plataforma Evaluación" <noreply@ugr.es>'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Interfaz de configuración de aplicación
 */
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
    queueLimit: number;
    waitForConnections: boolean;
    enableKeepAlive: boolean;
    keepAliveInitialDelay: number;
    maxRetries: number;
    retryDelayMs: number;
    queryTimeoutMs: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
  };
  logging: {
    level: string;
  };
  executionEngine: {
    url: string;
    apiKey?: string;
  };
  // NUEVO
  smtp: {
    host?: string;
    port: number;
    user?: string;
    pass?: string;
    from: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Valida y parsea las variables de entorno
 */
function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      console.error('Error validando variables de entorno:\n' + issues);
    }
    process.exit(1);
  }
}

/**
 * Valida configuración en función de ambiente
 */
function validateProductionConfig(config: AppConfig): void {
  if (config.isProduction) {
    const errors: string[] = [];

    if (config.jwt.secret === 'cambiar_en_produccion') {
      errors.push('  - JWT_SECRET debe ser cambiado en producción');
    }

    if (config.jwt.secret.length < 32) {
      errors.push(
        '  - JWT_SECRET debe tener mínimo 32 caracteres en producción'
      );
    }

    if (config.cors.origin === 'http://localhost:3001') {
      errors.push('  - CORS_ORIGIN debe ser configurado para producción');
    }

    if (errors.length > 0) {
      console.error(
        'Errores de configuración en producción:\n' + errors.join('\n')
      );
      process.exit(1);
    }
  }
}

/**
 * Carga y construye la configuración completa de la aplicación
 */
function loadConfig(): AppConfig {
  const env = validateEnv();

  const config: AppConfig = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      queueLimit: env.DB_QUEUE_LIMIT,
      waitForConnections: env.DB_WAIT_FOR_CONNECTIONS,
      enableKeepAlive: env.DB_ENABLE_KEEP_ALIVE,
      keepAliveInitialDelay: env.DB_KEEP_ALIVE_INITIAL_DELAY,
      maxRetries: env.DB_MAX_RETRIES,
      retryDelayMs: env.DB_RETRY_DELAY_MS,
      queryTimeoutMs: env.DB_QUERY_TIMEOUT_MS,
    },
    executionEngine: {
      url: env.EXECUTION_ENGINE_URL,
      apiKey: env.EXECUTION_ENGINE_API_KEY,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRY,
    },
    cors: {
      origin: env.CORS_ORIGIN,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM,
    },
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  };

  validateProductionConfig(config);

  return config;
}

const config: AppConfig = loadConfig();

// Log de configuración (ocultando valores sensibles)
if (config.isDevelopment) {
  logger.debug('Configuración cargada:', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    database: {
      ...config.database,
      password: '***',
    },
    jwt: {
      secret: '***',
      expiresIn: config.jwt.expiresIn,
    },
    smtp: {
      host: config.smtp.host,
      user: config.smtp.user ? '***' : undefined,
    },
  });
}

export default config;
