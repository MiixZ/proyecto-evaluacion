import api from "@/lib/api";
import { LoginResponse } from "@/types/auth.types";
import { LoginFormValues } from "@/schemas/auth.schema";

export const authService = {
  login: async (
    credentials: LoginFormValues
  ): Promise<LoginResponse["data"]> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);

    return response.data.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
