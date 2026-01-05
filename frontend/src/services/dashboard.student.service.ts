import api from "@/lib/api";

export interface SubmissionsByDayData {
  date: string;
  count: number;
}

export interface SuccessRateByDifficultyData {
  difficulty: string;
  successRate: number;
  totalAttempts: number;
  successfulAttempts: number;
}

export interface ProgressBySyllabusData {
  syllabusTitle: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface ScoreEvolutionData {
  date: string;
  averageScore: number;
  submissionCount: number;
}

export interface StudentDashboardCharts {
  submissionsByDay: SubmissionsByDayData[];
  successRateByDifficulty: SuccessRateByDifficultyData[];
  progressBySyllabus: ProgressBySyllabusData[];
  scoreEvolution: ScoreEvolutionData[];
}

class DashboardStudentService {
  async getChartsData(): Promise<StudentDashboardCharts> {
    const response = await api.get("/v1/dashboard/student/charts");
    return response.data.data;
  }
}

export const studentDashboardService = new DashboardStudentService();
