import api from "@/lib/api";
import { CreateFeedbackInput, FeedbackDTO } from "@/types/feedback.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const feedbackService = {
  getBySubmission: async (submissionId: string): Promise<FeedbackDTO[]> => {
    const { data } = await api.get<ApiResponse<FeedbackDTO[]>>(
      `/v1/feedback/submission/${submissionId}`
    );
    return data.data;
  },

  create: async (input: CreateFeedbackInput): Promise<FeedbackDTO> => {
    const { data } = await api.post<ApiResponse<FeedbackDTO>>(
      "/v1/feedback",
      input
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/v1/feedback/${id}`);
  },
};
