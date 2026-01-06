import express, { Response } from 'express';
import cors from 'cors';
import config from './config/environment';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';
import {
  authMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
} from './middleware/auth.middleware';
import { AuthRequest } from './types/request.types';

// Rutas
import routerAuth from '@routes/auth/auth';
import routerUsers from '@routes/user/user';
import routerSubmissions from '@routes/submission/submission';
import routerExercises from '@routes/exercise/exercise';
import routerSyllabus from '@routes/syllabus/syllabus';
import routerCourse from '@routes/course/course';
import routerGroup from '@routes/group/group';
import routerFeedback from '@routes/feedback/feedback';
import routerSubject from '@routes/subject/subject';
import routerDegree from '@routes/degree/degree';
import routerPlagiarism from '@routes/plagiarism/plagiarism';
import routerExport from '@routes/export/export';
import routerAudit from '@routes/audit/audit';
import routerDashboard from '@routes/dashboard/dashboard';
import routerLanguages from '@routes/language/language';
import routerHints from '@routes/hint/hint';
import routerSubmissionErrors from '@routes/catalog/submission-error';
import routerRanking from '@routes/ranking/ranking';

const app = express();
const PORT = config.port;

// ... (INICIALIZACIÓN e MIDDLEWARES sin cambios) ...

// ==================== INICIALIZACIÓN ====================

async function initializeApp(): Promise<void> {
  try {
    await initializeDatabase();
    logger.info('Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// ==================== MIDDLEWARES ====================

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLoggerMiddleware);

// ==================== RUTAS BASE ====================

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1', (_req, res: Response) => {
  res.json({
    name: 'Evaluación Automática API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/v1/users',
      exercises: '/api/v1/exercises',
      submissions: '/api/v1/submissions',
    },
  });
});

// ==================== API ROUTER ====================

// 1. Rutas Públicas
app.use('/api/auth', routerAuth);

// 2. Rutas Protegidas (API v1)
const apiV1 = express.Router();

// Middleware de autenticación global para v1
apiV1.use(authMiddleware);

apiV1.get('/me', (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Registro de submódulos
app.use('/api/v1', apiV1);

apiV1.use('/users', routerUsers);
apiV1.use('/exercises', routerExercises);
apiV1.use('/submissions', routerSubmissions);
apiV1.use('/syllabi', routerSyllabus);
apiV1.use('/courses', routerCourse);
apiV1.use('/groups', routerGroup);
apiV1.use('/feedback', routerFeedback);
apiV1.use('/subjects', routerSubject);
apiV1.use('/degrees', routerDegree);
apiV1.use('/plagiarism', routerPlagiarism);
apiV1.use('/exports', routerExport);
apiV1.use('/audit', routerAudit);
apiV1.use('/dashboard', routerDashboard);
apiV1.use('/languages', routerLanguages);
apiV1.use('/hints', routerHints);
apiV1.use('/submission-errors', routerSubmissionErrors);
apiV1.use('/ranking', routerRanking);

// ==================== MANEJO DE ERRORES ====================

// 404 Not Found
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Ruta no encontrada',
    },
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandlerMiddleware);

// ==================== ARRANQUE ====================

async function start(): Promise<void> {
  await initializeApp();

  app.listen(PORT, () => {
    logger.info(`Servidor iniciado en puerto ${PORT}`, {
      env: config.nodeEnv,
      url: `http://localhost:${PORT}`,
    });

    if (config.isDevelopment) {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50) + '\n');
    }
  });
}

// Graceful shutdown
const shutdown = () => {
  logger.info('Cerrando servidor...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export default app;
