import api from "@/lib/api";
import {
  ProfessorDashboardResponse,
  DashboardSubmission,
  PaginatedResponse,
  RecentActivityDTO,
  PlagiarismAlertDTO,
} from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const dashboardService = {
  getProfessorStats: async (
    groupId?: string
  ): Promise<ProfessorDashboardResponse> => {
    const url = groupId
      ? `/v1/dashboard/teacher/overview?groupId=${groupId}`
      : "/v1/dashboard/teacher/overview";

    const { data } = await api.get<ApiResponse<ProfessorDashboardResponse>>(
      url
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

  getGroupActivity: async (
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<RecentActivityDTO>> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<RecentActivityDTO>>
    >(
      `/v1/dashboard/teacher/group/${groupId}/activity?page=${page}&limit=${limit}`
    );

    return data.data;
  },

  getGroupPlagiarism: async (
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<PlagiarismAlertDTO>> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<PlagiarismAlertDTO>>
    >(
      `/v1/dashboard/teacher/group/${groupId}/plagiarism?page=${page}&limit=${limit}`
    );

    return data.data;
  },
};
