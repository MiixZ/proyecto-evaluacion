import express, { Response } from 'express';
import cors from 'cors';
import config from './config/environment.js';
import { initializeDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import {
  authMiddleware,
  requestLoggerMiddleware,
} from './middleware/auth.middleware.js';
import { AuthRequest } from './types/request.types.js';
import routerUsers from '@routes/user/user.js';
import routerSubmissions from '@routes/submission/submission.js';

const app = express();
const PORT = config.port;

// ==================== INICIALIZACIÓN DE BD ====================

/**
 * Inicializar base de datos antes de iniciar el servidor
 */
async function initializeApp(): Promise<void> {
  try {
    await initializeDatabase();
    logger.info('Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('Error inicializando base de datos:', error);

    process.exit(1);
  }
}

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
 * GET /health
 */
app.get('/health', (_req, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Información de la API
 * GET /api/v1
 */
app.get('/api/v1', (_req, res: Response) => {
  res.json({
    name: 'Evaluación Automática de Programación API',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      users: '/api/v1/users',
      submissions: '/api/v1/submissions',
      exercises: '/api/v1/exercises',
    },
  });
});

// ==================== RUTAS PROTEGIDAS ====================

/**
 * Ejemplo de ruta protegida
 * GET /api/v1/me
 */
app.get('/api/v1/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: req.user,
    timestamp: new Date().toISOString(),
  });
});

// ==================== RUTAS DE LA API ====================

/**
 * Usuarios
 * /api/v1/users
 * - POST   /api/v1/users                    → Crear usuario
 * - GET    /api/v1/users                    → Listar usuarios (paginado)
 * - GET    /api/v1/users/:id                → Obtener usuario por ID
 * - PATCH  /api/v1/users/:id                → Actualizar usuario
 * - PATCH  /api/v1/users/:id/role           → Cambiar rol (admin only)
 * - PATCH  /api/v1/users/:id/status         → Cambiar estado (admin only)
 * - DELETE /api/v1/users/:id                → Soft delete usuario
 * - GET    /api/v1/users/teachers           → Listar profesores
 * - GET    /api/v1/users/students           → Listar estudiantes
 */
app.use('/api/v1/users', routerUsers);

/**
 * Submissions
 * /api/v1/submissions
 * (A implementar)
 */
app.use('/api/v1/submissions', routerSubmissions);

// ==================== MIDDLEWARE DE ERROR 404 ====================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    timestamp: new Date().toISOString(),
  });
});

// ==================== INICIO DEL SERVIDOR ====================

/**
 * Función principal para iniciar la aplicación
 */
async function start(): Promise<void> {
  try {
    // Inicializar BD
    await initializeApp();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('Backend escuchando en puerto', PORT);
      console.log('Ambiente:', config.nodeEnv);
      console.log('URL base: http://localhost:' + PORT);
      console.log('API v1: http://localhost:' + PORT + '/api/v1');
      console.log('Health: http://localhost:' + PORT + '/health');
      console.log('='.repeat(60) + '\n');

      logger.info(`Servidor iniciado correctamente en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

// ==================== MANEJO DE SEÑALES ====================

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar aplicación
start();

export default app;
