import api from "@/lib/api";

export interface SubmissionsByDayData {
  date: string;
  count: number;
}

export interface AcceptanceRateByExerciseData {
  exerciseId: string;
  exerciseTitle: string;
  acceptanceRate: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
}

export interface StudentProgressData {
  studentId: string;
  studentName: string;
  exercisesCompleted: number;
  totalExercises: number;
  averageScore: number;
  lastActivity: string;
}

export interface SubmissionTrendData {
  hour: number;
  count: number;
}

export interface ProfessorDashboardCharts {
  submissionsByDay: SubmissionsByDayData[];
  acceptanceRateByExercise: AcceptanceRateByExerciseData[];
  studentProgress: StudentProgressData[];
  submissionTrend: SubmissionTrendData[];
}

class DashboardProfessorService {
  async getChartsData(groupId?: string): Promise<ProfessorDashboardCharts> {
    const response = await api.get("/v1/dashboard/teacher/charts", {
      params: { groupId },
    });
    return response.data.data;
  }

  async getExercisesList(
    groupId?: string
  ): Promise<Array<{ id: string; title: string }>> {
    const response = await api.get("/v1/dashboard/teacher/exercises", {
      params: { groupId },
    });
    return response.data.data;
  }
}

export const professorDashboardService = new DashboardProfessorService();
