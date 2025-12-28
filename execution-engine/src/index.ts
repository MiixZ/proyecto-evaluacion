import express, { Request, Response } from "express";
import { ExecutionManager } from "./managers/execution.manager";
import { ExecutionRequest } from "./types/execution.types";

const app = express();
const executionManager = new ExecutionManager();

// Middleware
app.use(express.json({ limit: "50mb" }));

// API Key validation
app.use((req: Request, res: Response, next: Function) => {
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.EXECUTION_ENGINE_API_KEY;

  if (apiKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();

  return;
});

/**
 * POST /execute
 * Ejecutar código de ejercicio
 */
app.post("/execute", async (req: Request, res: Response) => {
  try {
    const request: ExecutionRequest = req.body;

    console.log(`📨 Solicitud de ejecución recibida: ${request.id}`);

    // Validar request
    if (!request.id || !request.code || !request.testCases?.length) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Ejecutar
    const result = await executionManager.executeExercise(request);

    res.json(result);
  } catch (error: unknown) {
    console.error("❌ Error en /execute:", error);
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) });
  }

  return;
});

/**
 * GET /health
 * Health check
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /stats
 * Estadísticas de ejecución
 */
app.get("/stats", async (res: Response) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      maxConcurrentContainers: process.env.MAX_CONCURRENT_CONTAINERS,
    },
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🎯 Execution Engine escuchando en puerto ${PORT}`);
  console.log(`📍 API Key requerida en header: X-Api-Key`);
  console.log(
    `🐳 Network: ${process.env.SANDBOX_NETWORK || "evaluacion-net"}\n`
  );
});
