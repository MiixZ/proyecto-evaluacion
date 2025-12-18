import express, { Response } from 'express';
import cors from 'cors';
import config from './config/environment.js';
import {
  authMiddleware,
  requestLoggerMiddleware,
} from './middleware/auth.middleware.js';
import { AuthRequest } from './types/request.types.js';
import routerSubmissions from '@routes/submission/submission.js';

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
app.get('/health', (res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Información de la API
 */
app.get('/api/v1', (res: Response) => {
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

// ==================== RUTAS DE EJEMPLOS ====================
app.use('/api/submissions', routerSubmissions);

// ==================== RUTAS DE AUTENTICACIÓN (SIN PROTECCIÓN) ====================
// TODO: Implementar rutas de login, registro, etc.
// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🎯 Backend escuchando en puerto ${PORT}`);
  console.log(`📍 API Key requerida en header: X-Api-Key`);
  console.log(
    `🐳 Network: ${process.env.SANDBOX_NETWORK || 'evaluacion-net'}\n`
  );
});
