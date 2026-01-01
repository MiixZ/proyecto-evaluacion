import { apiClient } from "./api.client";
import { login, logout } from "../store/authStore";
import type { User } from "../types/auth.types";
import type { ApiResponse } from "../types/common";

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      {
        email,
        password,
      }
    );

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Error al iniciar sesión");
    }

    login(data.data.token, data.data.user);

    return data.data.user;
  },

  logout() {
    logout();
  },

  async checkAuthStatus() {
    try {
      const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");

      return data.data;
    } catch (error) {
      this.logout();

      return null;
    }
  },
};
