import api from "@/lib/api";
import { Exercise, SubmissionResponse } from "@/types/exercise.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const exerciseService = {
  getById: async (id: string): Promise<Exercise> => {
    const { data } = await api.get<ApiResponse<Exercise>>(`v1/exercises/${id}`);

    return data.data;
  },

  submitSolution: async (payload: {
    exerciseId: string;
    courseId: string;
    code: string;
    language: string;
  }): Promise<SubmissionResponse> => {
    const { data } = await api.post<ApiResponse<SubmissionResponse>>(
      "v1/submissions",
      payload
    );
    return data.data;
  },
};
