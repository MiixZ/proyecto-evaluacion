import api from "@/lib/api";

export interface SyllabusDTO {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  contentType: "module" | "topic" | "lesson";
  orderIndex: number;
  isPublic: boolean;
  exercisesCount?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const syllabusService = {
  getByCourse: async (courseId: string): Promise<SyllabusDTO[]> => {
    const { data } = await api.get<ApiResponse<SyllabusDTO[]>>(
      `/v1/syllabi/course/${courseId}`
    );
    return data.data;
  },

  toggleVisibility: async (syllabusId: string): Promise<SyllabusDTO> => {
    const { data } = await api.patch<ApiResponse<SyllabusDTO>>(
      `/v1/syllabi/${syllabusId}/visibility`
    );
    return data.data;
  },

  create: async (input: {
    courseId: string;
    title: string;
    description?: string;
    contentType?: "module" | "topic" | "lesson";
    orderIndex?: number;
    isPublic?: boolean;
  }): Promise<SyllabusDTO> => {
    const { data } = await api.post<ApiResponse<SyllabusDTO>>(
      "/v1/syllabi",
      input
    );
    return data.data;
  },

  delete: async (syllabusId: string): Promise<void> => {
    await api.delete(`/v1/syllabi/${syllabusId}`);
  },

  updateOrder: async (
    syllabusId: string,
    orderIndex: number
  ): Promise<SyllabusDTO> => {
    const { data } = await api.patch<ApiResponse<SyllabusDTO>>(
      `/v1/syllabi/${syllabusId}/order`,
      { orderIndex }
    );
    return data.data;
  },
};
