import api from "@/lib/api";
import { StudentDashboardProgress } from "@/types/dashboard.types";
import { StudentSubmission } from "@/types/exercise.types";
import { UpdateProfilePayload, UserProfile } from "@/types/user.type";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const studentService = {
  getProgress: async (): Promise<StudentDashboardProgress[]> => {
    const { data } = await api.get<ApiResponse<StudentDashboardProgress[]>>(
      "v1/dashboard/student/progress"
    );

    return data.data;
  },

  getAllSubmissions: async (): Promise<StudentSubmission[]> => {
    const { data } = await api.get("/v1/submissions");

    return data.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const { data } = await api.get("/v1/users/profile/me");

    return data.data;
  },

  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const { data } = await api.patch("/v1/users/me", payload);

    return data.data;
  },
};
