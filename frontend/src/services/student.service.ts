import api from "@/lib/api";
import { StudentProgress } from "@/types/dashboard.types";

export const studentService = {
  getProgress: async (): Promise<StudentProgress[]> => {
    const { data } = await api.get<StudentProgress[]>(
      "v1/dashboard/student/progress"
    );

    return data;
  },
};
