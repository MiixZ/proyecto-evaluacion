import { CodeExecutor } from "../services/code.executor";
import { DOCKER_CONFIG } from "../config/docker.config";
import {
  ExecutionRequest,
  ExecutionResult,
  Verdict,
} from "../types/execution.types";

/**
 * Gestor principal de ejecución de código
 * Coordina la ejecución de ejercicios completos con todos sus test cases
 */
export class ExecutionManager {
  private codeExecutor: CodeExecutor;

  constructor() {
    this.codeExecutor = new CodeExecutor();
  }

  /**
   * Ejecuta un ejercicio completo con todos sus test cases
   * @param request - Solicitud de ejecución con código y casos de prueba
   * @returns Resultado de ejecución con veredicto y puntuación
   */
  async executeExercise(request: ExecutionRequest): Promise<ExecutionResult> {
    console.log(
      `\nIniciando ejecución: ${request.id} (Ejercicio: ${request.exerciseId})`
    );

    const startTime = Date.now();
    const testResults = [];
    let verdict = Verdict.ACCEPTED;

    try {
      const sandboxImage = this.getSandboxImage(request.language);

      console.log(`Usando imagen: ${sandboxImage}`);

      let passedTests = 0;

      for (const testCase of request.testCases) {
        console.log(`Ejecutando test case: ${testCase.id}`);

        const testResult = await this.codeExecutor.executeCode(
          sandboxImage,
          request.code,
          testCase,
          request.language,
          `${request.id}-${testCase.id}`
        );

        testResults.push(testResult);

        if (testResult.status === "passed") {
          passedTests++;
          console.log(`Test ${testCase.id}: PASSED`);
        } else if (testResult.status === "timeout") {
          verdict = Verdict.TIME_LIMIT_EXCEEDED;
          console.log(`Test ${testCase.id}: TIMEOUT`);
        } else if (testResult.status === "error") {
          verdict = Verdict.RUNTIME_ERROR;
          console.log(
            `Test ${testCase.id}: ERROR - ${testResult.errorMessage}`
          );
        } else if (testResult.status === "failed") {
          if (verdict === Verdict.ACCEPTED) {
            verdict = Verdict.WRONG_ANSWER;
          }
          console.log(`Test ${testCase.id}: WRONG ANSWER`);
          console.log(`Esperado: "${testResult.expectedOutput}"`);
          console.log(`Obtenido: "${testResult.actualOutput}"`);
        }
      }

      const score = Math.round((passedTests / request.testCases.length) * 100);

      console.log(
        `Ejecución completada: ${passedTests}/${request.testCases.length} tests passed`
      );
      console.log(`Veredicto: ${verdict} (${score} puntos)`);

      return {
        submissionId: request.submissionId,
        verdict,
        score,
        testResults,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      };
    } catch (error: Error | any) {
      console.error(`Error en ejecución: ${error.message}`);

      return {
        submissionId: request.submissionId,
        verdict: Verdict.SYSTEM_ERROR,
        score: 0,
        testResults,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        runtimeError: error.message,
      };
    }
  }

  /**
   * Obtiene la imagen Docker apropiada según el lenguaje
   * @param language - Lenguaje de programación
   * @returns Nombre de la imagen Docker
   */
  private getSandboxImage(language: string): string {
    const images = DOCKER_CONFIG.sandboxImages;

    if (language in images) {
      return images[language as keyof typeof images];
    }

    return images.python;
  }
}
