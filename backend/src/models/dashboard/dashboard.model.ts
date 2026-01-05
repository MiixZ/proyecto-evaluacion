import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './dashboard.row';
import {
  AcademicStructureRow,
  AdminStatsRow,
  GlobalStatsRow,
  TeacherStatsRow,
} from './dashboard.row';

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
    filterType?: string,
    reviewStatus?: string
  ): Promise<{ items: Rows.PlagiarismAlertRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const offset = Math.max(0, (page - 1) * safeLimit);

    const sortMap: Record<string, string> = {
      studentName: 'u.last_name',
      exerciseTitle: 'e.title',
      similarity: 'pc.similarity_percent',
      type: 'pc.plagiarism_type',
      date: 'pc.created_at',
      status: 'pc.reviewed_at',
    };
    const orderBy = sortMap[sortBy] || 'pc.created_at';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = 'ug.group_id = ? AND pc.is_flagged = TRUE';
    const params: any[] = [groupId];

    if (filterType && filterType !== 'all') {
      whereClause += ' AND pc.plagiarism_type = ?';
      params.push(filterType);
    }

    if (reviewStatus === 'pending') {
      whereClause += ' AND pc.reviewed_at IS NULL';
    } else if (reviewStatus === 'reviewed') {
      whereClause += ' AND pc.reviewed_at IS NOT NULL';
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
        pc.created_at,
        pc.reviewed_at
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

  async getGroupActivity(
    groupId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    status?: string,
    studentId?: string
  ): Promise<any> {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ug.group_id = ?';
    const params: any[] = [groupId];

    if (status && status !== 'all') {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (studentId) {
      whereClause += ' AND s.student_id = ?';
      params.push(studentId);
    }

    const sortMap: Record<string, string> = {
      date: 's.created_at',
      studentName: 'u.first_name',
      exerciseTitle: 'e.title',
      score: 's.score',
      status: 's.status',
    };
    const sortCol = sortMap[sortBy] || 's.created_at';

    const query = `
      SELECT 
        s.id, s.status, s.score, s.created_at as time, s.verdict,
        e.title as exerciseTitle, e.difficulty,
        CONCAT(u.first_name, ' ', u.last_name) as studentName,
        u.profile_image_url as avatarUrl,
        u.email
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN users u ON s.student_id = u.id
      -- Verificamos que el usuario pertenezca al grupo solicitado
      JOIN user_groups ug ON u.id = ug.user_id
      -- Verificamos que la entrega sea del curso al que pertenece el grupo
      JOIN \`groups\` g ON ug.group_id = g.id AND s.course_id = g.course_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id AND s.course_id = g.course_id
      ${whereClause}
    `;

    try {
      const [rows] = await getPool().query<any[]>(query, [
        ...params,
        limit,
        offset,
      ]);
      const [countRows] = await getPool().query<any[]>(countQuery, params);

      return {
        items: rows.map((row) => ({
          id: row.id,
          studentName: row.studentName,
          avatarUrl: row.avatarUrl,
          email: row.email,
          exerciseTitle: row.exerciseTitle,
          difficulty: row.difficulty,
          status: row.status,
          verdict: row.verdict,
          score: row.score,
          time: row.time,
        })),
        total: countRows[0].total,
        page,
        totalPages: Math.ceil(countRows[0].total / limit),
      };
    } catch (error) {
      console.error('Error en getGroupActivity:', error);
      throw error;
    }
  }

  async getAdminKPIs(academicYear: string): Promise<AdminStatsRow> {
    const query = `
      SELECT
        (SELECT COUNT(DISTINCT d.id) 
         FROM degrees d 
         JOIN subjects s ON d.id = s.degree_id 
         JOIN courses c ON s.id = c.subject_id 
         WHERE c.academic_year = ?) as activeDegrees,
         
        (SELECT COUNT(DISTINCT s.id) 
         FROM subjects s 
         JOIN courses c ON s.id = c.subject_id 
         WHERE c.academic_year = ?) as activeSubjects,
         
        (SELECT COUNT(DISTINCT ug.user_id) 
         FROM user_groups ug 
         JOIN \`groups\` g ON ug.group_id = g.id 
         JOIN courses c ON g.course_id = c.id 
         WHERE c.academic_year = ? AND ug.role = 'teacher') as activeTeachers,
         
        (SELECT COUNT(DISTINCT e.id) 
         FROM exercises e 
         JOIN syllabi syl ON e.syllabus_id = syl.id 
         JOIN courses c ON syl.course_id = c.id 
         WHERE c.academic_year = ?) as totalExercises
    `;

    const [rows] = await getPool().execute<any[]>(query, [
      academicYear,
      academicYear,
      academicYear,
      academicYear,
    ]);

    return rows[0] as AdminStatsRow;
  }

  async getAcademicStructure(
    academicYear: string,
    search: string = ''
  ): Promise<AcademicStructureRow[]> {
    let searchClause = '';
    const params: any[] = [academicYear];

    if (search) {
      searchClause = 'AND d.name LIKE ?';
      params.push(`%${search}%`);
    }

    const query = `
      SELECT 
        d.id as degree_id,
        d.name as degree_name,
        s.id as subject_id,
        s.name as subject_name,
        COUNT(DISTINCT g.id) as group_count,
        COUNT(DISTINCT ug_student.user_id) as student_count,
        COUNT(DISTINCT e.id) as exercise_count
      FROM degrees d
      JOIN subjects s ON d.id = s.degree_id
      JOIN courses c ON s.id = c.subject_id
      LEFT JOIN \`groups\` g ON c.id = g.course_id
      LEFT JOIN user_groups ug_student ON g.id = ug_student.group_id AND ug_student.role = 'student'
      LEFT JOIN syllabi syl ON c.id = syl.course_id
      LEFT JOIN exercises e ON syl.id = e.syllabus_id
      WHERE c.academic_year = ? ${searchClause}
      GROUP BY d.id, s.id
      ORDER BY d.name, s.name
    `;

    const [rows] = await getPool().execute<any[]>(query, params);

    return rows as AcademicStructureRow[];
  }

  async getTeacherStatsList(academicYear: string): Promise<TeacherStatsRow[]> {
    const query = `
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT c.subject_id) as subject_count,
        COUNT(DISTINCT ug.group_id) as group_count
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      WHERE ug.role = 'teacher' AND c.academic_year = ?
      GROUP BY u.id
      ORDER BY u.last_name ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, [academicYear]);

    return rows as TeacherStatsRow[];
  }

  async getGlobalStats(): Promise<GlobalStatsRow> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active') as activeStudents,
        (SELECT COUNT(*) FROM submissions WHERE DATE(created_at) = CURDATE()) as submissionsToday,
        (SELECT COALESCE(
            (SUM(CASE WHEN verdict = 'accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
            0
         ) FROM submissions) as successRate
    `;

    const [rows] = await getPool().execute<any[]>(query);

    return rows[0] as GlobalStatsRow;
  }
}

export const dashboardModel = new DashboardModel();
