import api from "@/lib/api";
import { SubmissionDetailDTO } from "@/types/submission.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const submissionService = {
  getById: async (id: string): Promise<SubmissionDetailDTO> => {
    const { data } = await api.get<ApiResponse<SubmissionDetailDTO>>(
      `/v1/submissions/${id}`
    );

    return data.data;
  },
};
