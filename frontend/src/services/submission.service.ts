import api from "@/lib/api";
import { SubmissionDetailDTO } from "@/types/submission.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Servicio para consulta de detalles de envíos de código
 */
export const submissionService = {
  /**
   * Obtiene los detalles completos de un envío
   * @param id - ID del envío
   * @returns Detalles del envío con resultados de test cases
   */
  getById: async (id: string): Promise<SubmissionDetailDTO> => {
    const { data } = await api.get<ApiResponse<SubmissionDetailDTO>>(
      `/v1/submissions/${id}`
    );

    return data.data;
  },
};
