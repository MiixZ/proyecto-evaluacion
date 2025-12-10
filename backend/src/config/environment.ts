import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  authgear: {
    endpoint: string;
    clientId: string;
    clientSecret: string;
    apiKey: string;
  };
  cors: {
    origin: string | string[];
  };
  logging: {
    level: string;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'evaluacion_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'cambiar_en_produccion',
    expiresIn: process.env.JWT_EXPIRY || '7d',
  },
  authgear: {
    endpoint: process.env.AUTHGEAR_ENDPOINT || '',
    clientId: process.env.AUTHGEAR_CLIENT_ID || '',
    clientSecret: process.env.AUTHGEAR_CLIENT_SECRET || '',
    apiKey: process.env.AUTHGEAR_API_KEY || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

export default config;
