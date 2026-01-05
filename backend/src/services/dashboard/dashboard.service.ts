import { dashboardModel } from '@models/dashboard/dashboard.model';

export class DashboardService {
  async getGroupActivity(
    groupId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    status?: string,
    studentId?: string
  ) {
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (page < 1 || limit < 1) {
      throw new Error('Invalid pagination parameters');
    }

    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      throw new Error('Sort order must be ASC or DESC');
    }

    return await dashboardModel.getGroupActivity(
      groupId,
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      studentId
    );
  }

  async getAdminDashboard(academicYear: string, search?: string) {
    const kpis = await dashboardModel.getAdminKPIs(academicYear);
    const structureRows = await dashboardModel.getAcademicStructure(
      academicYear,
      search
    );
    const teachers = await dashboardModel.getTeacherStatsList(academicYear);
    const globalStats = await dashboardModel.getGlobalStats();

    const degreesMap = new Map<string, any>();

    structureRows.forEach((row) => {
      if (!degreesMap.has(row.degree_id)) {
        degreesMap.set(row.degree_id, {
          id: row.degree_id,
          name: row.degree_name,
          subjects: [],
        });
      }

      const degree = degreesMap.get(row.degree_id);
      if (row.subject_id) {
        degree.subjects.push({
          id: row.subject_id,
          name: row.subject_name,
          stats: {
            groups: row.group_count,
            students: row.student_count,
            exercises: row.exercise_count,
          },
        });
      }
    });

    return {
      kpis,
      academicStructure: Array.from(degreesMap.values()),
      teachers,
      globalStats,
    };
  }

  async getAcademicYears() {
    return await dashboardModel.getAvailableAcademicYears();
  }

  async getCurrentAcademicYear(): Promise<string> {
    const latest = await dashboardModel.getLatestAcademicYear();
    if (latest) return latest;

    const now = new Date();
    const currentYear = now.getFullYear();
    const isSecondSemester = now.getMonth() < 8;
    const startYear = isSecondSemester ? currentYear - 1 : currentYear;

    return `${startYear}-${startYear + 1}`;
  }

  async getAdminChartsData() {
    const submissionsByDay = await dashboardModel.getSubmissionsByDay();
    const languageDistribution = await dashboardModel.getLanguageDistribution();
    const acceptanceRateByDifficulty =
      await dashboardModel.getAcceptanceRateByDifficulty();
    const usersByRole = await dashboardModel.getUsersByRole();

    return {
      submissionsByDay,
      languageDistribution,
      acceptanceRateByDifficulty,
      usersByRole,
    };
  }

  async getTeacherChartsData(groupId?: string) {
    const submissionsByDay =
      await dashboardModel.getTeacherSubmissionsByDay(groupId);
    const acceptanceRateByExercise =
      await dashboardModel.getAcceptanceRateByExercise(groupId);
    const studentProgress =
      await dashboardModel.getGroupStudentProgress(groupId);
    const submissionTrend = await dashboardModel.getSubmissionTrend(groupId);

    return {
      submissionsByDay,
      acceptanceRateByExercise,
      studentProgress,
      submissionTrend,
    };
  }

  async getStudentChartsData(studentId: string) {
    const submissionsByDay =
      await dashboardModel.getStudentSubmissionsByDay(studentId);
    const successRateByDifficulty =
      await dashboardModel.getSuccessRateByDifficulty(studentId);
    const progressBySyllabus =
      await dashboardModel.getProgressBySyllabus(studentId);
    const scoreEvolution = await dashboardModel.getScoreEvolution(studentId);

    return {
      submissionsByDay,
      successRateByDifficulty,
      progressBySyllabus,
      scoreEvolution,
    };
  }
}

export const dashboardService = new DashboardService();
