import {
  ExecutionRequest,
  ExecutionResult,
} from '@CustomTypes/submission.types';
import axios, { AxiosInstance } from 'axios';
import config from '@config/environment';
import { logger } from '@utils/logger';

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

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      logger.debug(`Enviando a Execution Engine: ${request.id}`);

      const response = await this.client.post<ExecutionResult>(
        '/execute',
        request
      );

      logger.debug(
        `Resultado recibido: ${request.id} - ${response.data.verdict}`
      );

      return response.data;
    } catch (error: any) {
      logger.error(`❌ Error Engine: ${error.message}`, {
        response: error.response?.data,
      });

      throw new Error(`Execution Engine Error: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      await this.client.get('/health');

      return true;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await this.client.get('/stats');

      return response.data;
    } catch (error: unknown) {
      console.error('Error getting stats:', error);

      return null;
    }
  }
}
