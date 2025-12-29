import { getPool } from '@config/database';
import { UUID } from '@CustomTypes/common.types';
import * as Rows from './dashboard.row';

export class DashboardModel {
  async getStudentProgress(
    studentId?: UUID,
    courseId?: UUID
  ): Promise<Rows.StudentProgressRow[]> {
    let query = 'SELECT * FROM v_student_progress WHERE 1=1';
    const params: any[] = [];

    if (studentId) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }
    if (courseId) {
      query += ' AND course_id = ?';
      params.push(courseId);
    }

    query += ' ORDER BY last_attempt DESC';

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
}

export const dashboardModel = new DashboardModel();
