import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { SyllabusEntity } from './syllabus.entity';
import { SyllabusRow } from './syllabus.row';
import { syllabusMapper } from '@mappers/syllabus.mapper';
import { CreateSyllabusInput } from '@validators/syllabus.validator';
import { UUID } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';

export class SyllabusModel {
  async create(input: CreateSyllabusInput): Promise<SyllabusEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO syllabi (
        id, course_id, title, description, content_type, order_index, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      id,
      input.courseId,
      input.title,
      input.description || null,
      input.contentType,
      input.orderIndex,
      input.isPublic,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<SyllabusEntity> {
    const [rows] = await getPool().execute<SyllabusRow[]>(
      'SELECT * FROM syllabi WHERE id = ?',
      [id]
    );
    if (rows.length === 0) throw new NotFoundError('Temario con id: ' + id);

    return syllabusMapper.toEntity(rows[0]);
  }

  async listByCourse(courseId: UUID): Promise<SyllabusEntity[]> {
    const [rows] = await getPool().execute<SyllabusRow[]>(
      'SELECT * FROM syllabi WHERE course_id = ? ORDER BY order_index ASC',
      [courseId]
    );

    return rows.map((row) => syllabusMapper.toEntity(row));
  }

  async exists(id: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<any[]>(
      'SELECT 1 FROM syllabi WHERE id = ?',
      [id]
    );

    return rows.length > 0;
  }
}

export const syllabusModel = new SyllabusModel();
