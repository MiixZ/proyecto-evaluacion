import api from "@/lib/api";
import {
  ProfessorDashboardResponse,
  DashboardSubmission,
  PaginatedResponse,
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
    page: number,
    limit: number,
    column: string,
    direction: string,
    status?: string,
    studentId?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: column,
      sortOrder: direction,
      ...(status && status !== "all" && { status }),
      ...(studentId && { studentId }),
    });

    const { data } = await api.get<
      ApiResponse<PaginatedResponse<DashboardSubmission>>
    >(`/v1/dashboard/teacher/group/${groupId}/activity?${params}`);

    return data.data;
  },

  getGroupPlagiarism: async (
    groupId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: string = "date",
    sortOrder: "ASC" | "DESC" = "DESC",
    type: string = "all"
  ): Promise<PaginatedResponse<PlagiarismAlertDTO>> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<PlagiarismAlertDTO>>
    >(`/v1/dashboard/teacher/group/${groupId}/plagiarism`, {
      params: { page, limit, sortBy, sortOrder, type },
    });

    return data.data;
  },
};
