import express from 'express';
import cors from 'cors';
import config from './config/environment.js';
import {
  authMiddleware,
  requestLoggerMiddleware,
} from './middleware/auth.middleware.js';
import { AuthRequest } from './types/request.types.js';

const app = express();

// ==================== MIDDLEWARES GLOBALES ====================

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger
app.use(requestLoggerMiddleware);

// ==================== RUTAS DE SALUD ====================

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Información de la API
 */
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Evaluación Automática de Programación API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// ==================== RUTAS PROTEGIDAS ====================

/**
 * Ejemplo de ruta protegida
 */
app.get('/api/v1/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: req.user,
    timestamp: new Date().toISOString(),
  });
});

// ==================== RUTAS DE AUTENTICACIÓN (SIN PROTECCIÓN) ====================
// TODO: Implementar rutas de login, registro, etc.
