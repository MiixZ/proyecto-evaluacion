import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { PlagiarismEntity } from './plagiarism.entity';
import { PlagiarismRow, PlagiarismPatternRow } from './plagiarism.row';
import { plagiarismMapper } from '@mappers/plagiarism.mapper';
import {
  CreatePlagiarismCheckInput,
  ReviewPlagiarismInput,
} from '@validators/plagiarism.validator';
import {
  UUID,
  PaginatedResponse,
  PlagiarismType,
} from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class PlagiarismModel {
  async create(input: CreatePlagiarismCheckInput): Promise<PlagiarismEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO plagiarism_checks (
        id, submission_id, compared_with_submission_id, similarity_percent,
        plagiarism_type, tool_used, tool_report_url, is_flagged, notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await getPool().execute(query, [
      id,
      input.submissionId,
      input.comparedWithSubmissionId,
      input.similarityPercent,
      input.plagiarismType,
      input.toolUsed || null,
      input.toolReportUrl || null,
      input.isFlagged ? 1 : 0,
      input.notes || null,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<PlagiarismEntity> {
    const [rows] = await getPool().execute<PlagiarismRow[]>(
      'SELECT * FROM plagiarism_checks WHERE id = ?',
      [id]
    );
    if (rows.length === 0)
      throw new NotFoundError('Registro de plagio con id: ' + id);

    return plagiarismMapper.toEntity(rows[0]);
  }

  async listBySubmission(submissionId: UUID): Promise<PlagiarismEntity[]> {
    const [rows] = await getPool().execute<PlagiarismRow[]>(
      'SELECT * FROM plagiarism_checks WHERE submission_id = ? ORDER BY similarity_percent DESC',
      [submissionId]
    );

    return rows.map((row) => plagiarismMapper.toEntity(row));
  }

  async updateReview(
    id: UUID,
    input: ReviewPlagiarismInput,
    reviewerId: UUID
  ): Promise<PlagiarismEntity> {
    const query = `
      UPDATE plagiarism_checks 
      SET is_flagged = ?, notes = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE id = ?
    `;

    const [result] = await getPool().execute<any>(query, [
      input.isFlagged ? 1 : 0,
      input.notes || null,
      reviewerId,
      id,
    ]);

    if (result.affectedRows === 0)
      throw new NotFoundError('Registro de plagio con id: ' + id);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: { isFlagged?: boolean; type?: PlagiarismType }
  ): Promise<PaginatedResponse<PlagiarismEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.isFlagged !== undefined) {
      whereClause += ' AND is_flagged = ?';
      params.push(filters.isFlagged ? 1 : 0);
    }
    if (filters?.type) {
      whereClause += ' AND plagiarism_type = ?';
      params.push(filters.type);
    }

    const countQuery = `SELECT COUNT(*) as count FROM plagiarism_checks WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM plagiarism_checks WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await getPool().execute<PlagiarismRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);
    const items = rows.map((row) => plagiarismMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Encuentra patrones de plagio recurrentes para un estudiante
   * detectando con quién coincide frecuentemente
   */
  async findStudentPatterns(studentId: UUID): Promise<
    Array<{
      otherStudentId: string;
      studentName: string;
      matchCount: number;
      avgSimilarity: number;
    }>
  > {
    const query = `
      SELECT 
        u.id as other_student_id,
        u.first_name,
        u.last_name,
        COUNT(*) as match_count,
        AVG(pc.similarity_percent) as avg_similarity
      FROM plagiarism_checks pc
      JOIN submissions s1 ON pc.submission_id = s1.id
      JOIN submissions s2 ON pc.compared_with_submission_id = s2.id
      JOIN users u ON (CASE WHEN s1.student_id = ? THEN s2.student_id ELSE s1.student_id END) = u.id
      WHERE (s1.student_id = ? OR s2.student_id = ?)
        AND pc.similarity_percent > 70
      GROUP BY u.id
      ORDER BY match_count DESC, avg_similarity DESC
      LIMIT 10
    `;

    const [rows] = await getPool().execute<PlagiarismPatternRow[]>(query, [
      studentId,
      studentId,
      studentId,
    ]);

    return rows.map((row) => ({
      otherStudentId: row.other_student_id,
      studentName: `${row.first_name} ${row.last_name}`,
      matchCount: Number(row.match_count),
      avgSimilarity: Number(row.avg_similarity),
    }));
  }
}

export const plagiarismModel = new PlagiarismModel();
