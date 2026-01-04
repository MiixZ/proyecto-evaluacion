import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './dashboard.row';

export class DashboardModel {
  async getStudentProgress(
    studentId?: UUID,
    courseId?: UUID
  ): Promise<Rows.StudentProgressRow[]> {
    let query = `
      SELECT 
        u.id AS student_id,
        u.first_name,
        u.last_name,
        c.id AS course_id,
        c.academic_year,
        e.id AS exercise_id,
        e.title AS exercise_title,
        s.name AS subject_name,
        COALESCE(sub_stats.attempts, 0) as attempts,
        COALESCE(sub_stats.is_completed, 0) as is_completed,
        COALESCE(sub_stats.best_score, 0) as best_score,
        sub_stats.last_attempt,
        e.difficulty,
        e.deadline
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN syllabi syl ON c.id = syl.course_id
      JOIN exercises e ON syl.id = e.syllabus_id
      LEFT JOIN (
          SELECT 
              exercise_id, 
              student_id,
              COUNT(id) as attempts,
              MAX(CASE WHEN verdict = 'accepted' THEN 1 ELSE 0 END) as is_completed,
              MAX(score) as best_score,
              MAX(created_at) as last_attempt
          FROM submissions
          GROUP BY exercise_id, student_id
      ) sub_stats ON e.id = sub_stats.exercise_id AND u.id = sub_stats.student_id
      
      WHERE u.id = ? 
      AND e.is_published = TRUE
    `;

    const params: any[] = [studentId];

    if (courseId) {
      query += ' AND c.id = ?';
      params.push(courseId);
    }

    query += ' ORDER BY sub_stats.last_attempt DESC, e.deadline ASC';

    const [rows] = await getPool().execute<Rows.StudentProgressRow[]>(
      query,
      params
    );

    return rows;
  }

  async getGroupStatistics(teacherId?: UUID): Promise<Rows.GroupStatsRow[]> {
    let query = 'SELECT * FROM v_group_statistics';
    const params: any[] = [];

    if (teacherId) {
      query = `
        SELECT v.* FROM v_group_statistics v
        JOIN user_groups ug ON v.group_id = ug.group_id
        WHERE ug.user_id = ? AND ug.role = 'teacher'
      `;
      params.push(teacherId);
    }

    const [rows] = await getPool().execute<Rows.GroupStatsRow[]>(query, params);

    return rows;
  }

  async getTeacherWorkload(
    teacherId: UUID
  ): Promise<Rows.TeacherWorkloadRow | null> {
    const [rows] = await getPool().execute<Rows.TeacherWorkloadRow[]>(
      'SELECT * FROM v_teacher_workload WHERE teacher_id = ?',
      [teacherId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  async getExerciseMetrics(
    courseId?: UUID
  ): Promise<Rows.ExerciseMetricsRow[]> {
    let query = 'SELECT em.* FROM v_exercise_metrics em';
    const params: any[] = [];

    if (courseId) {
      query += `
          JOIN exercises e ON em.exercise_id = e.id
          JOIN syllabi s ON e.syllabus_id = s.id
          WHERE s.course_id = ?
        `;
      params.push(courseId);
    }

    const [rows] = await getPool().execute<Rows.ExerciseMetricsRow[]>(
      query,
      params
    );

    return rows;
  }

  async getPlagiarismSummary(
    courseId?: UUID
  ): Promise<Rows.PlagiarismSummaryRow[]> {
    let query = 'SELECT * FROM v_plagiarism_summary WHERE 1=1';
    const params: any[] = [];

    if (courseId) {
      query += ' AND course_id = ?';
      params.push(courseId);
    }

    const [rows] = await getPool().execute<Rows.PlagiarismSummaryRow[]>(
      query,
      params
    );

    return rows;
  }

  async getGroupDetails(groupId: UUID): Promise<Rows.GroupStatsRow | null> {
    const [rows] = await getPool().execute<Rows.GroupStatsRow[]>(
      'SELECT * FROM v_group_statistics WHERE group_id = ?',
      [groupId]
    );

    return rows[0] || null;
  }

  async getStudentsByGroup(groupId: UUID): Promise<Rows.GroupStudentRow[]> {
    const query = `
      SELECT 
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_image_url,
        COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' THEN s.exercise_id END) as exercises_completed,
        COALESCE(AVG(s.score), 0) as avg_score,
        MAX(s.created_at) as last_access,
        u.status
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      LEFT JOIN submissions s ON u.id = s.student_id
      WHERE ug.group_id = ? AND ug.role = 'student'
      GROUP BY u.id
      ORDER BY u.last_name ASC
    `;

    const [rows] = await getPool().execute<Rows.GroupStudentRow[]>(query, [
      groupId,
    ]);

    return rows;
  }

  async getRecentActivityByGroup(
    groupId: UUID,
    page: number = 1,
    limit: number = 5,
    sortBy: string = 'date',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    filterStatus?: string
  ): Promise<{ items: Rows.RecentActivityRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const offset = Math.max(0, (page - 1) * safeLimit);

    const sortMap: Record<string, string> = {
      studentName: 'u.last_name',
      exerciseTitle: 'e.title',
      status: 's.verdict',
      date: 's.created_at',
    };
    const orderBy = sortMap[sortBy] || 's.created_at';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = 'ug.group_id = ?';
    const params: any[] = [groupId];

    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'passed') {
        whereClause += " AND s.verdict = 'accepted'";
      } else if (filterStatus === 'failed') {
        whereClause +=
          " AND s.verdict IN ('wrong_answer', 'compilation_error', 'runtime_error', 'time_limit')";
      } else if (filterStatus === 'pending') {
        whereClause += " AND s.status != 'completed'";
      }
    }

    const baseQuery = `
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      JOIN user_groups ug ON u.id = ug.user_id 
      WHERE ${whereClause}
    `;

    const query = `
      SELECT 
        s.id as submission_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        e.title as exercise_title,
        s.status,
        s.verdict,
        s.created_at
      ${baseQuery}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

    const [rows] = await getPool().execute<Rows.RecentActivityRow[]>(
      query,
      params
    );

    const [countRows] = await getPool().execute<any[]>(countQuery, params);

    return {
      items: rows,
      total: countRows[0].total,
    };
  }

  async getPlagiarismAlertsByGroup(
    groupId: UUID,
    page: number = 1,
    limit: number = 5,
    sortBy: string = 'date',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    filterType?: string
  ): Promise<{ items: Rows.PlagiarismAlertRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const offset = Math.max(0, (page - 1) * safeLimit);

    const sortMap: Record<string, string> = {
      studentName: 'u.last_name',
      exerciseTitle: 'e.title',
      similarity: 'pc.similarity_percent',
      type: 'pc.plagiarism_type',
      date: 'pc.created_at',
    };
    const orderBy = sortMap[sortBy] || 'pc.created_at';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = 'ug.group_id = ? AND pc.is_flagged = TRUE';
    const params: any[] = [groupId];

    if (filterType && filterType !== 'all') {
      whereClause += ' AND pc.plagiarism_type = ?';
      params.push(filterType);
    }

    const baseQuery = `
      FROM plagiarism_checks pc
      JOIN submissions s ON pc.submission_id = s.id
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      JOIN user_groups ug ON u.id = ug.user_id
      WHERE ${whereClause}
    `;

    const query = `
      SELECT 
        pc.id as check_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        e.title as exercise_title,
        pc.similarity_percent,
        pc.plagiarism_type,
        pc.created_at
      ${baseQuery}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

    const [rows] = await getPool().execute<Rows.PlagiarismAlertRow[]>(
      query,
      params
    );
    const [countRows] = await getPool().execute<any[]>(countQuery, params);

    return {
      items: rows,
      total: countRows[0].total,
    };
  }
}

export const dashboardModel = new DashboardModel();
