import {
  ExecutionRequest,
  ExecutionResult,
} from '@CustomTypes/submission.types';
import axios, { AxiosInstance } from 'axios';
import config from '@config/environment';
import { logger } from '@utils/logger';

/**
 * Estadísticas del motor de ejecución
 */
export interface EngineStats {
  uptime: number;
  memoryUsage: {
    heapTotal: number;
    heapUsed: number;
  };
  queueSize: number;
  activeExecutions: number;
}

/**
 * Cliente HTTP para comunicación con el motor de ejecución de código
 * Gestiona envíos, health checks y estadísticas
 */
export class ExecutionEngineClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.executionEngine.url,
      headers: {
        'X-Api-Key': config.executionEngine.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  /**
   * Envía código para ejecución y evaluación
   * @param request - Solicitud con código, test cases y límites
   * @returns Resultado de ejecución con veredicto y detalles
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      logger.debug(`Enviando a Execution Engine: ${request.id}`);
      const response = await this.client.post<ExecutionResult>(
        '/execute',
        request
      );
      return response.data;
    } catch (error: any) {
      logger.error(`❌ Error Engine: ${error.message}`, {
        response: error.response?.data,
      });

      throw new Error(
        `Execution Engine Error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Verifica si el motor de ejecución está disponible
   * @returns true si el servicio responde correctamente
   */
  async health(): Promise<boolean> {
    try {
      await this.client.get('/health');

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene estadísticas del motor de ejecución
   * @returns Estadísticas o null si hay error
   */
  async getStats(): Promise<EngineStats | null> {
    try {
      const response = await this.client.get<EngineStats>('/stats');
      return response.data;
    } catch (error: unknown) {
      logger.error('Error getting stats form engine', error);

      return null;
    }
  }
}
