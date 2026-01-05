import api from "@/lib/api";

export interface SubmissionsByDayData {
  date: string;
  count: number;
}

export interface LanguageDistributionData {
  language: string;
  count: number;
  percentage: number;
}

export interface AcceptanceRateByDifficultyData {
  difficulty: string;
  acceptanceRate: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
}

export interface UsersByRoleData {
  role: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardCharts {
  submissionsByDay: SubmissionsByDayData[];
  languageDistribution: LanguageDistributionData[];
  acceptanceRateByDifficulty: AcceptanceRateByDifficultyData[];
  usersByRole: UsersByRoleData[];
}

export const adminDashboardService = {
  getChartsData: async (): Promise<AdminDashboardCharts> => {
    const { data } = await api.get("/v1/dashboard/admin/charts");
    return data.data;
  },
};
