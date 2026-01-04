import api from "@/lib/api";
import {
  ProfessorStats,
  DashboardSubmission,
  PaginatedResponse,
} from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const dashboardService = {
  getProfessorStats: async (): Promise<ProfessorStats> => {
    const { data } = await api.get<ApiResponse<ProfessorStats>>(
      "/v1/dashboard/professor/stats"
    );
    return data.data;
  },

  getRecentSubmissions: async (
    limit: number = 5
  ): Promise<DashboardSubmission[]> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<DashboardSubmission>>
    >(`/v1/submissions?limit=${limit}&page=1`);
    return data.data.items;
  },
};
