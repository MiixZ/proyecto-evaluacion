import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './dashboard.row';
import {
  AcademicStructureRow,
  AdminStatsRow,
  GlobalStatsRow,
  StudentProgressRow,
  TeacherStatsRow,
} from './dashboard.row';

export class DashboardModel {
  async getStudentProgress(
    studentId?: UUID,
    courseId?: UUID
  ): Promise<StudentProgressRow[]> {
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
        syl.title AS syllabus_title,
        syl.description AS syllabus_description,
        COALESCE(sub_stats.attempts, 0) as attempts,
        COALESCE(sub_stats.is_completed, 0) as is_completed,
        COALESCE(sub_stats.best_score, 0) as best_score,
        sub_stats.last_attempt,
        e.difficulty,
        e.points,
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
          WHERE archived = FALSE
          GROUP BY exercise_id, student_id
      ) sub_stats ON e.id = sub_stats.exercise_id AND u.id = sub_stats.student_id
      
      WHERE u.id = ? 
      AND ug.status = 'active'
      AND c.status IN ('active', 'planning')
      AND s.status = 'active'
      AND e.is_published = TRUE
      AND syl.is_public = TRUE
    `;

    const params: any[] = [studentId];

    if (courseId) {
      query += ' AND c.id = ?';
      params.push(courseId);
    }

    query +=
      ' ORDER BY s.name ASC, syl.order_index ASC, e.order_index ASC, e.created_at ASC';

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

  async getAvailableAcademicYears(): Promise<string[]> {
    const query =
      'SELECT DISTINCT academic_year FROM courses ORDER BY academic_year DESC';
    const [rows] = await getPool().execute<any[]>(query);

    return rows.map((r) => r.academic_year);
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
        COUNT(DISTINCT CASE WHEN dt.is_accepted = 1 THEN dt.exercise_id END) as exercises_completed,
        COALESCE(AVG(dt.max_score), 0) as avg_score,
        MAX(dt.last_attempt) as last_access,
        ug.status
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id
      
      LEFT JOIN (
          SELECT 
              s.student_id, 
              s.course_id,
              s.exercise_id,
              MAX(s.score) as max_score,
              MAX(s.created_at) as last_attempt,
              MAX(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) as is_accepted
          FROM submissions s
          WHERE s.archived = FALSE
          GROUP BY s.student_id, s.course_id, s.exercise_id
      ) dt ON u.id = dt.student_id AND dt.course_id = g.course_id
      
      WHERE ug.group_id = ? AND ug.role = 'student'
      GROUP BY u.id, ug.status
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
        AND ug.status = 'active'
        AND s.archived = FALSE
        AND e.is_published = TRUE
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
      LEFT JOIN submissions s2 ON pc.compared_with_submission_id = s2.id
      LEFT JOIN users u2 ON s2.student_id = u2.id
      WHERE ${whereClause}
        AND ug.status = 'active'
        AND s.archived = FALSE
        AND e.is_published = TRUE
    `;

    const query = `
      SELECT 
        pc.id as check_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as compared_student_name,
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
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id AND s.course_id = g.course_id
      ${whereClause}
        AND u.status = 'active'
        AND s.archived = FALSE
        AND e.is_published = TRUE
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id AND s.course_id = g.course_id
      JOIN exercises e ON s.exercise_id = e.id
      ${whereClause}
        AND u.status = 'active'
        AND s.archived = FALSE
        AND e.is_published = TRUE
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
         WHERE c.academic_year = ? 
           AND d.status = 'active'
           AND s.status = 'active'
           AND c.status IN ('active', 'planning')) as activeDegrees,
         
        (SELECT COUNT(DISTINCT s.id) 
         FROM subjects s 
         JOIN courses c ON s.id = c.subject_id 
         WHERE c.academic_year = ?
           AND s.status = 'active'
           AND c.status IN ('active', 'planning')) as activeSubjects,
         
        (SELECT COUNT(DISTINCT ug.user_id) 
         FROM user_groups ug 
         JOIN \`groups\` g ON ug.group_id = g.id 
         JOIN courses c ON g.course_id = c.id 
         WHERE c.academic_year = ? 
           AND ug.role = 'teacher'
           AND c.status IN ('active', 'planning')) as activeTeachers,
         
        (SELECT COUNT(DISTINCT e.id) 
         FROM exercises e 
         JOIN syllabi syl ON e.syllabus_id = syl.id 
         JOIN courses c ON syl.course_id = c.id 
         WHERE c.academic_year = ?
           AND c.status IN ('active', 'planning')) as totalExercises
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
      WHERE c.academic_year = ? 
        AND d.status = 'active'
        AND s.status = 'active'
        AND c.status IN ('active', 'planning')
        ${searchClause}
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
      WHERE ug.role = 'teacher' 
        AND c.academic_year = ?
        AND c.status IN ('active', 'planning')
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

  async getLatestAcademicYear(): Promise<string | null> {
    const query =
      'SELECT academic_year FROM courses ORDER BY academic_year DESC LIMIT 1';
    const [rows] = await getPool().execute<any[]>(query);
    return rows.length > 0 ? rows[0].academic_year : null;
  }

  async getSubmissionsByDay(): Promise<Array<{ date: string; count: number }>> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM submissions
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [rows] = await getPool().execute<any[]>(query);
    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getLanguageDistribution(): Promise<
    Array<{ language: string; count: number; percentage: number }>
  > {
    const query = `
      SELECT 
        e.language,
        COUNT(s.id) as count,
        ROUND((COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM submissions)), 2) as percentage
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      GROUP BY e.language
      ORDER BY count DESC
    `;

    const [rows] = await getPool().execute<any[]>(query);
    return rows.map((row) => ({
      language: row.language,
      count: Number(row.count),
      percentage: Number(row.percentage),
    }));
  }

  async getAcceptanceRateByDifficulty(): Promise<
    Array<{
      difficulty: string;
      acceptanceRate: number;
      totalSubmissions: number;
      acceptedSubmissions: number;
    }>
  > {
    const query = `
      SELECT 
        e.difficulty,
        COUNT(s.id) as totalSubmissions,
        SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) as acceptedSubmissions,
        ROUND(
          (SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id)), 
          2
        ) as acceptanceRate
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      GROUP BY e.difficulty
      ORDER BY 
        CASE e.difficulty
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
        END
    `;

    const [rows] = await getPool().execute<any[]>(query);
    return rows.map((row) => ({
      difficulty: row.difficulty,
      acceptanceRate: Number(row.acceptanceRate),
      totalSubmissions: Number(row.totalSubmissions),
      acceptedSubmissions: Number(row.acceptedSubmissions),
    }));
  }

  async getUsersByRole(): Promise<
    Array<{ role: string; count: number; percentage: number }>
  > {
    const query = `
      SELECT 
        role,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE status = 'active')), 2) as percentage
      FROM users
      WHERE status = 'active'
      GROUP BY role
      ORDER BY count DESC
    `;

    const [rows] = await getPool().execute<any[]>(query);
    return rows.map((row) => ({
      role: row.role,
      count: Number(row.count),
      percentage: Number(row.percentage),
    }));
  }

  async getTeacherSubmissionsByDay(
    groupId?: string
  ): Promise<Array<{ date: string; count: number }>> {
    let query = `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as count
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      JOIN syllabi syl ON e.syllabus_id = syl.id
      JOIN courses c ON syl.course_id = c.id
    `;

    const params: any[] = [];

    if (groupId) {
      query += `
        JOIN \`groups\` g ON c.id = g.course_id
        JOIN user_groups ug ON u.id = ug.user_id AND g.id = ug.group_id
        WHERE g.id = ? AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND ug.status = 'active' AND s.archived = FALSE
          AND c.status IN ('active', 'planning', 'closed')
      `;
      params.push(groupId);
    } else {
      query += ` WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND s.archived = FALSE
        AND c.status IN ('active', 'planning', 'closed') `;
    }

    query += `
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, params);
    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getAcceptanceRateByExercise(groupId?: string): Promise<
    Array<{
      exerciseId: string;
      exerciseTitle: string;
      acceptanceRate: number;
      totalSubmissions: number;
      acceptedSubmissions: number;
    }>
  > {
    let query = `
      SELECT 
        e.id as exerciseId,
        e.title as exerciseTitle,
        COUNT(s.id) as totalSubmissions,
        SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) as acceptedSubmissions,
        ROUND(
          (SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id)), 
          2
        ) as acceptanceRate
      FROM exercises e
      JOIN syllabi syl ON e.syllabus_id = syl.id
      JOIN courses c ON syl.course_id = c.id
      LEFT JOIN submissions s ON e.id = s.exercise_id AND s.archived = FALSE
      LEFT JOIN users u ON s.student_id = u.id
    `;

    const params: any[] = [];

    if (groupId) {
      query += `
        JOIN \`groups\` g ON c.id = g.course_id
        JOIN user_groups ug ON u.id = ug.user_id AND g.id = ug.group_id
        WHERE g.id = ? AND (ug.status = 'active' OR u.id IS NULL)
          AND c.status IN ('active', 'planning', 'closed')
      `;
      params.push(groupId);
    } else {
      query += ` WHERE (u.id IS NULL OR u.id IN (
        SELECT user_id FROM user_groups WHERE status = 'active'
      )) 
      AND c.status IN ('active', 'planning', 'closed') `;
    }

    query += `
      GROUP BY e.id
      HAVING COUNT(s.id) > 0
      ORDER BY totalSubmissions DESC
    `;

    const [rows] = await getPool().execute<any[]>(query, params);
    return rows.map((row) => ({
      exerciseId: row.exerciseId,
      exerciseTitle: row.exerciseTitle,
      acceptanceRate: Number(row.acceptanceRate),
      totalSubmissions: Number(row.totalSubmissions),
      acceptedSubmissions: Number(row.acceptedSubmissions),
    }));
  }

  async getGroupStudentProgress(groupId?: string): Promise<
    Array<{
      studentId: string;
      studentName: string;
      exercisesCompleted: number;
      totalExercises: number;
      averageScore: number;
      lastActivity: string;
    }>
  > {
    let query = `
      SELECT 
        u.id as studentId,
        CONCAT(u.first_name, ' ', u.last_name) as studentName,
        COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' AND s.archived = FALSE THEN e.id END) as exercisesCompleted,
        COUNT(DISTINCT e.id) as totalExercises,
        COALESCE(AVG(CASE WHEN s.archived = FALSE THEN s.score END), 0) as averageScore,
        MAX(CASE WHEN s.archived = FALSE THEN s.created_at END) as lastActivity
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN syllabi syl ON c.id = syl.course_id
      JOIN exercises e ON syl.id = e.syllabus_id
      LEFT JOIN submissions s ON e.id = s.exercise_id AND u.id = s.student_id
      WHERE ug.role = 'student' AND ug.status = 'active'
        AND c.status IN ('active', 'planning', 'closed')
    `;

    const params: any[] = [];

    if (groupId) {
      query += ` AND g.id = ? `;
      params.push(groupId);
    }

    query += `
      GROUP BY u.id
      ORDER BY exercisesCompleted DESC
    `;

    const [rows] = await getPool().execute<any[]>(query, params);
    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName,
      exercisesCompleted: Number(row.exercisesCompleted),
      totalExercises: Number(row.totalExercises),
      averageScore: Number(row.averageScore),
      lastActivity: row.lastActivity,
    }));
  }

  async getSubmissionTrend(
    groupId?: string
  ): Promise<Array<{ hour: number; count: number }>> {
    let query = `
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as count
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      JOIN syllabi syl ON e.syllabus_id = syl.id
      JOIN courses c ON syl.course_id = c.id
    `;

    const params: any[] = [];

    if (groupId) {
      query += `
        JOIN \`groups\` g ON c.id = g.course_id
        JOIN user_groups ug ON u.id = ug.user_id AND g.id = ug.group_id
        WHERE g.id = ? AND ug.status = 'active' AND s.archived = FALSE
          AND c.status IN ('active', 'planning', 'closed')
      `;
      params.push(groupId);
    } else {
      query += `
        WHERE s.archived = FALSE AND c.status IN ('active', 'planning', 'closed')
      `;
    }

    query += `
      GROUP BY HOUR(s.created_at)
      ORDER BY hour ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, params);
    return rows.map((row) => ({
      hour: Number(row.hour),
      count: Number(row.count),
    }));
  }

  async getStudentSubmissionsByDay(
    studentId: string
  ): Promise<Array<{ date: string; count: number }>> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM submissions
      WHERE student_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, [studentId]);
    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getSuccessRateByDifficulty(studentId: string): Promise<
    Array<{
      difficulty: string;
      successRate: number;
      totalAttempts: number;
      successfulAttempts: number;
    }>
  > {
    const query = `
      SELECT 
        e.difficulty,
        COUNT(s.id) as totalAttempts,
        SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) as successfulAttempts,
        ROUND(
          (SUM(CASE WHEN s.verdict = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id)), 
          2
        ) as successRate
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.student_id = ?
      GROUP BY e.difficulty
      ORDER BY 
        CASE e.difficulty
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
        END
    `;

    const [rows] = await getPool().execute<any[]>(query, [studentId]);
    return rows.map((row) => ({
      difficulty: row.difficulty,
      successRate: Number(row.successRate),
      totalAttempts: Number(row.totalAttempts),
      successfulAttempts: Number(row.successfulAttempts),
    }));
  }

  async getProgressBySyllabus(studentId: string): Promise<
    Array<{
      syllabusTitle: string;
      completed: number;
      total: number;
      percentage: number;
    }>
  > {
    const query = `
      SELECT 
        syl.title as syllabusTitle,
        COUNT(DISTINCT e.id) as total,
        COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' THEN e.id END) as completed,
        ROUND(
          (COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' THEN e.id END) * 100.0 / COUNT(DISTINCT e.id)),
          2
        ) as percentage
      FROM user_groups ug
      JOIN \`groups\` g ON ug.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN syllabi syl ON c.id = syl.course_id
      JOIN exercises e ON syl.id = e.syllabus_id
      LEFT JOIN submissions s ON e.id = s.exercise_id AND s.student_id = ug.user_id
      WHERE ug.user_id = ? AND ug.role = 'student'
        AND ug.status = 'active'
        AND c.status IN ('active', 'planning', 'closed')
      GROUP BY syl.id
      ORDER BY percentage DESC
    `;

    const [rows] = await getPool().execute<any[]>(query, [studentId]);
    return rows.map((row) => ({
      syllabusTitle: row.syllabusTitle,
      completed: Number(row.completed),
      total: Number(row.total),
      percentage: Number(row.percentage),
    }));
  }

  async getScoreEvolution(
    studentId: string
  ): Promise<
    Array<{ date: string; averageScore: number; submissionCount: number }>
  > {
    const query = `
      SELECT 
        DATE(created_at) as date,
        AVG(score) as averageScore,
        COUNT(*) as submissionCount
      FROM submissions
      WHERE student_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [rows] = await getPool().execute<any[]>(query, [studentId]);
    return rows.map((row) => ({
      date: row.date,
      averageScore: Number(row.averageScore),
      submissionCount: Number(row.submissionCount),
    }));
  }

  async getStudentLoginStreak(studentId: UUID): Promise<number> {
    const query = `
      SELECT DISTINCT DATE(created_at) as login_date
      FROM audit_logs
      WHERE user_id = ? AND action = 'LOGIN'
      ORDER BY login_date DESC
      LIMIT 60
    `;
    const [rows] = await getPool().execute<any[]>(query, [studentId]);

    if (rows.length === 0) return 0;

    const dates = rows.map((r) => {
      const d = new Date(r.login_date);
      return d.toISOString().split('T')[0];
    });

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let currentCheckDate: Date;
    if (dates.includes(today)) {
      currentCheckDate = new Date(today);
    } else if (dates.includes(yesterday)) {
      currentCheckDate = new Date(yesterday);
    } else {
      return 0;
    }

    let streak = 0;

    while (true) {
      const checkStr = currentCheckDate.toISOString().split('T')[0];
      if (dates.includes(checkStr)) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

export const dashboardModel = new DashboardModel();
