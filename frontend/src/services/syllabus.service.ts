import api from "@/lib/api";

export interface SyllabusDTO {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  contentType: "module" | "topic" | "lesson";
  orderIndex: number;
  isPublic: boolean;
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
};
