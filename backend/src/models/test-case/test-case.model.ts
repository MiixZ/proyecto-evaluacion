// src/models/test-case/test-case.model.ts
import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import { TestCase } from '@CustomTypes/submission.types';

export class TestCaseModel {
  /**
   * Obtiene los casos de prueba para ejecución (incluyendo ocultos)
   */
  async getForExecution(exerciseId: UUID): Promise<TestCase[]> {
    const pool = getPool();
    const query = `
      SELECT id, input, expected_output as expectedOutput, 
             runner_code as runnerCode,
             time_limit_seconds as timeLimit, memory_limit_mb as memoryLimit,
             is_hidden as isHidden
      FROM test_cases 
      WHERE exercise_id = ? 
      ORDER BY order_index ASC
    `;

    const [rows] = await pool.execute<any[]>(query, [exerciseId]);

    return rows;
  }
}

export const testCaseModel = new TestCaseModel();
