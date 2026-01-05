import api from "@/lib/api";
import {
  ProfessorDashboardResponse,
  DashboardSubmission,
  PaginatedResponse,
  PlagiarismAlertDTO,
  AdminDashboardResponse,
} from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Servicio para obtención de estadísticas y datos del dashboard
 * Incluye métricas para profesores, admin, y actividad de grupos
 */
export const dashboardService = {
  /**
   * Obtiene estadísticas del dashboard de profesor
   */
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

  /**
   * Obtiene estadísticas del dashboard de administrador
   */
  getAdminStats: async (
    academicYear?: string,
    search?: string
  ): Promise<AdminDashboardResponse> => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (search) params.append("search", search);

    const { data } = await api.get<ApiResponse<AdminDashboardResponse>>(
      `/v1/dashboard/admin?${params.toString()}`
    );

    return data.data;
  },

  /**
   * Obtiene lista de años académicos disponibles
   */
  getAcademicYears: async (): Promise<string[]> => {
    const { data } = await api.get<ApiResponse<string[]>>(
      "/v1/dashboard/academic-years"
    );

    return data.data;
  },

  /**
   * Obtiene envíos recientes
   */
  getRecentSubmissions: async (
    limit: number = 5
  ): Promise<DashboardSubmission[]> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<DashboardSubmission>>
    >(`/v1/submissions?limit=${limit}&page=1`);

    return data.data.items;
  },

  /**
   * Obtiene actividad de un grupo con filtros y ordenamiento
   */
  getGroupActivity: async (
    groupId: string,
    page: number,
    limit: number,
    column: string,
    direction: string,
    verdict?: string,
    studentId?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: column,
      sortOrder: direction,
      ...(verdict && verdict !== "all" && { verdict }),
      ...(studentId && { studentId }),
    });

    const { data } = await api.get<
      ApiResponse<PaginatedResponse<DashboardSubmission>>
    >(`/v1/dashboard/teacher/group/${groupId}/activity?${params}`);

    return data.data;
  },

  /**
   * Obtiene casos de plagio detectados en un grupo
   */
  getGroupPlagiarism: async (
    groupId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: string = "date",
    sortOrder: "ASC" | "DESC" = "DESC",
    type: string = "all",
    reviewStatus: string = "all"
  ): Promise<PaginatedResponse<PlagiarismAlertDTO>> => {
    const { data } = await api.get<
      ApiResponse<PaginatedResponse<PlagiarismAlertDTO>>
    >(`/v1/dashboard/teacher/group/${groupId}/plagiarism`, {
      params: { page, limit, sortBy, sortOrder, type, reviewStatus },
    });

    return data.data;
  },
};
