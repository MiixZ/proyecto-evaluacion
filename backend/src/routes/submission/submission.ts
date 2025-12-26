import { Router } from 'express';
import { ExecutionEngineClient } from '@services/shared/executionEngineClient';
import { v4 as uuidv4 } from 'uuid';

const routerSubmissions = Router();
const executionClient = new ExecutionEngineClient();

/**
 * POST /api/submissions/:exerciseId
 * Enviar código para evaluación
 */
routerSubmissions.post('/:exerciseId', async (req, res) => {
  try {
    const { code, language, testCases, limits } = req.body;
    const exerciseId = req.params.exerciseId;

    const executionRequest = {
      id: uuidv4(),
      exerciseId,
      submissionId: uuidv4(),
      code,
      language,
      testCases,
      limits,
      createdAt: new Date(),
    };

    const result = await executionClient.executeCode(executionRequest);

    // TODO: Guardar resultado en BD
    // await saveSubmissionResult(result);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error submitting code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default routerSubmissions;
