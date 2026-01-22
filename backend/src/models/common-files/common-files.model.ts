import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './common-files.row';
import {
  ExerciseCommonFileEntity,
  SyllabusCommonFileEntity,
  CreateCommonFileInput,
  UpdateCommonFileInput,
} from './common-files.entity';
import { v4 as uuidv4 } from 'uuid';

export class CommonFilesModel {
  // ==================== EXERCISE COMMON FILES ====================

  async getExerciseFiles(
    exerciseId: UUID
  ): Promise<ExerciseCommonFileEntity[]> {
    const [rows] = await getPool().execute<Rows.ExerciseCommonFileRow[]>(
      'SELECT * FROM exercise_common_files WHERE exercise_id = ? ORDER BY filename ASC',
      [exerciseId]
    );
    return rows.map(this.mapExerciseFileRow);
  }

  async getExerciseFileById(
    id: UUID
  ): Promise<ExerciseCommonFileEntity | null> {
    const [rows] = await getPool().execute<Rows.ExerciseCommonFileRow[]>(
      'SELECT * FROM exercise_common_files WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapExerciseFileRow(rows[0]) : null;
  }

  async createExerciseFile(
    exerciseId: UUID,
    input: CreateCommonFileInput
  ): Promise<ExerciseCommonFileEntity> {
    const id = uuidv4();
    await getPool().execute(
      `INSERT INTO exercise_common_files (id, exercise_id, filename, content, file_type, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        exerciseId,
        input.filename,
        input.content,
        input.fileType || 'source',
        input.description || null,
      ]
    );
    return (await this.getExerciseFileById(id as UUID))!;
  }

  async updateExerciseFile(
    id: UUID,
    input: UpdateCommonFileInput
  ): Promise<ExerciseCommonFileEntity | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.filename !== undefined) {
      updates.push('filename = ?');
      values.push(input.filename);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      values.push(input.content);
    }
    if (input.fileType !== undefined) {
      updates.push('file_type = ?');
      values.push(input.fileType);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    if (updates.length === 0) return this.getExerciseFileById(id);

    values.push(id);
    await getPool().execute(
      `UPDATE exercise_common_files SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return this.getExerciseFileById(id);
  }

  async deleteExerciseFile(id: UUID): Promise<boolean> {
    const [result] = await getPool().execute(
      'DELETE FROM exercise_common_files WHERE id = ?',
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  // ==================== SYLLABUS COMMON FILES ====================

  async getSyllabusFiles(
    syllabusId: UUID
  ): Promise<SyllabusCommonFileEntity[]> {
    const [rows] = await getPool().execute<Rows.SyllabusCommonFileRow[]>(
      'SELECT * FROM syllabus_common_files WHERE syllabus_id = ? ORDER BY filename ASC',
      [syllabusId]
    );
    return rows.map(this.mapSyllabusFileRow);
  }

  async getSyllabusFileById(
    id: UUID
  ): Promise<SyllabusCommonFileEntity | null> {
    const [rows] = await getPool().execute<Rows.SyllabusCommonFileRow[]>(
      'SELECT * FROM syllabus_common_files WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapSyllabusFileRow(rows[0]) : null;
  }

  async createSyllabusFile(
    syllabusId: UUID,
    input: CreateCommonFileInput
  ): Promise<SyllabusCommonFileEntity> {
    const id = uuidv4();
    await getPool().execute(
      `INSERT INTO syllabus_common_files (id, syllabus_id, filename, content, file_type, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        syllabusId,
        input.filename,
        input.content,
        input.fileType || 'source',
        input.description || null,
      ]
    );
    return (await this.getSyllabusFileById(id as UUID))!;
  }

  async updateSyllabusFile(
    id: UUID,
    input: UpdateCommonFileInput
  ): Promise<SyllabusCommonFileEntity | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.filename !== undefined) {
      updates.push('filename = ?');
      values.push(input.filename);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      values.push(input.content);
    }
    if (input.fileType !== undefined) {
      updates.push('file_type = ?');
      values.push(input.fileType);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    if (updates.length === 0) return this.getSyllabusFileById(id);

    values.push(id);
    await getPool().execute(
      `UPDATE syllabus_common_files SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return this.getSyllabusFileById(id);
  }

  async deleteSyllabusFile(id: UUID): Promise<boolean> {
    const [result] = await getPool().execute(
      'DELETE FROM syllabus_common_files WHERE id = ?',
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  // ==================== ROW MAPPERS ====================

  private mapExerciseFileRow(
    row: Rows.ExerciseCommonFileRow
  ): ExerciseCommonFileEntity {
    return {
      id: row.id as UUID,
      exerciseId: row.exercise_id as UUID,
      filename: row.filename,
      content: row.content,
      fileType: row.file_type,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSyllabusFileRow(
    row: Rows.SyllabusCommonFileRow
  ): SyllabusCommonFileEntity {
    return {
      id: row.id as UUID,
      syllabusId: row.syllabus_id as UUID,
      filename: row.filename,
      content: row.content,
      fileType: row.file_type,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const commonFilesModel = new CommonFilesModel();
