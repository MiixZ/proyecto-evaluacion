import api from "@/lib/api";
import { StudentProgress } from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const studentService = {
  getProgress: async (): Promise<StudentProgress[]> => {
    const { data } = await api.get<ApiResponse<StudentProgress[]>>(
      "v1/dashboard/student/progress"
    );

    return data.data;
  },
};
