import { ExecutionRequest, ExecutionResult } from '@CustomTypes/submission.types';
import axios, { AxiosInstance } from 'axios';

export class ExecutionEngineClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.EXECUTION_ENGINE_URL || 'http://execution-engine:3001';
    this.apiKey = process.env.EXECUTION_ENGINE_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 segundos
    });
  }

  /**
   * Enviar código a ejecución
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      console.log(`📤 Enviando a Execution Engine: ${request.id}`);

      const response = await this.client.post<ExecutionResult>(
        '/execute',
        request
      );

      console.log(
        `📥 Resultado recibido: ${request.id} - ${response.data.verdict}`
      );

      return response.data;
    } catch (error: unknown) {
      console.error(`❌ Error comunicándose con Execution Engine:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to execute code: ${errorMessage}`
      );
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
