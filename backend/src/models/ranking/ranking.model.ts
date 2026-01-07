import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './ranking.row';

export class RankingModel {
  /**
   * Obtiene el ranking de estudiantes con filtros opcionales
   */
  async getRanking(
    subjectId?: UUID,
    groupId?: UUID
  ): Promise<Rows.RankingStudentRow[]> {
    let query = `
      SELECT 
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_image_url,
        COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' AND s.archived = FALSE THEN s.exercise_id END) as exercises_completed,
        COUNT(DISTINCT e.id) as total_exercises,
        COALESCE(AVG(CASE WHEN s.archived = FALSE AND s.verdict = 'accepted' THEN s.score END), 0) as avg_score,
        COUNT(CASE WHEN s.archived = FALSE THEN s.id END) as total_submissions,
        COUNT(CASE WHEN s.archived = FALSE AND s.verdict = 'accepted' THEN s.id END) as accepted_submissions,
        COUNT(CASE WHEN s.archived = FALSE AND s.score = 100 THEN s.id END) as perfect_scores,
        MAX(CASE WHEN s.archived = FALSE THEN s.created_at END) as last_submission
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id AND ug.role = 'student'
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects subj ON c.subject_id = subj.id
      JOIN syllabi syl ON c.id = syl.course_id AND syl.is_public = TRUE
      JOIN exercises e ON syl.id = e.syllabus_id AND e.is_published = TRUE
      LEFT JOIN submissions s ON u.id = s.student_id AND e.id = s.exercise_id
      WHERE u.status = 'active'
        AND ug.status = 'active'
        AND c.status IN ('active', 'planning')
        AND subj.status = 'active'
    `;

    const params: any[] = [];

    if (subjectId) {
      query += ' AND subj.id = ?';
      params.push(subjectId);
    }

    if (groupId) {
      query += ' AND g.id = ?';
      params.push(groupId);
    }

    query += `
      GROUP BY u.id
      ORDER BY exercises_completed DESC, avg_score DESC, accepted_submissions DESC, u.last_name ASC
    `;

    const [rows] = await getPool().execute<Rows.RankingStudentRow[]>(
      query,
      params
    );

    return rows;
  }

  /**
   * Obtiene información del profesor de una asignatura
   */
  async getSubjectTeacher(
    subjectId: UUID
  ): Promise<Rows.SubjectTeacherRow | null> {
    const query = `
      SELECT 
        u.id as teacher_id,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        u.email as teacher_email,
        u.profile_image_url as teacher_image,
        s.name as subject_name,
        COUNT(DISTINCT c.id) as course_count
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id AND ug.role = 'teacher'
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE s.id = ?
        AND u.status = 'active'
        AND c.status IN ('active', 'planning')
        AND s.status = 'active'
      GROUP BY u.id, s.name
      LIMIT 1
    `;

    const [rows] = await getPool().execute<Rows.SubjectTeacherRow[]>(query, [
      subjectId,
    ]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Obtiene las opciones de filtro disponibles para el usuario
   */
  async getFilterOptions(userId: UUID): Promise<Rows.RankingFilterInfo[]> {
    const query = `
      SELECT DISTINCT
        s.id as subject_id,
        s.name as subject_name,
        g.id as group_id,
        g.name as group_name,
        c.id as course_id,
        c.academic_year
      FROM user_groups ug
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE ug.user_id = ?
        AND ug.status = 'active'
        AND c.status IN ('active', 'planning')
        AND s.status = 'active'
      ORDER BY s.name ASC, c.academic_year DESC, g.name ASC
    `;

    const [rows] = await getPool().execute<Rows.RankingFilterInfo[]>(query, [
      userId,
    ]);

    return rows;
  }

  /**
   * Obtiene todas las asignaturas activas (para admin/teacher)
   */
  async getAllSubjects(): Promise<
    Array<{ subject_id: string; subject_name: string }>
  > {
    const query = `
      SELECT DISTINCT
        s.id as subject_id,
        s.name as subject_name
      FROM subjects s
      WHERE s.status = 'active'
      ORDER BY s.name ASC
    `;

    const [rows] = await getPool().execute<any[]>(query);
    return rows;
  }

  /**
   * Obtiene todos los grupos activos de una asignatura (para admin/teacher)
   */
  async getSubjectGroups(
    subjectId: UUID
  ): Promise<
    Array<{ group_id: string; group_name: string; academic_year: string }>
  > {
    const query = `
      SELECT DISTINCT
        g.id as group_id,
        g.name as group_name,
        c.academic_year
      FROM \`groups\` g
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE s.id = ?
        AND c.status IN ('active', 'planning')
      ORDER BY c.academic_year DESC, g.name ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, [subjectId]);
    return rows;
  }
}

export const rankingModel = new RankingModel();
