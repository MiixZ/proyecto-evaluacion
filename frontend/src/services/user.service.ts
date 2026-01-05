import api from "@/lib/api";
import {
  User,
  CreateUserPayload,
  UserRole,
  UserStatus,
} from "@/types/user.type";
import { PaginatedResponse } from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const userService = {
  list: async (
    page = 1,
    limit = 1000,
    search = "",
    role?: UserRole | "all",
    status?: UserStatus | "all",
    groupId?: string
  ): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && role !== "all" && { role }),
      ...(status && status !== "all" && { status }),
      ...(groupId && { groupId }),
    });

    const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>(
      `/v1/users?${params}`
    );

    return data.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<ApiResponse<User>>("/v1/users", payload);

    return data.data;
  },

  changeRole: async (id: string, role: UserRole): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/v1/users/${id}/role`,
      {
        role,
      }
    );

    return data.data;
  },

  changeStatus: async (id: string, status: UserStatus): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/v1/users/${id}/status`,
      {
        status,
      }
    );

    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/v1/users/${id}`);
  },
};
