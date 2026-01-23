/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";
import {
  User,
  CreateUserPayload,
  CreateUserResponse,
  UserRole,
  UserStatus,
} from "@/types/user.type";
import { PaginatedResponse } from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Servicio para gestión de usuarios
 * CRUD completo, asignación de grupos y cambio de roles/estados
 */
export const userService = {
  /**
   * Lista usuarios con filtros y paginación
   */
  list: async (
    page = 1,
    limit = 1000,
    search = "",
    role?: UserRole | "all",
    status?: UserStatus | "all",
    groupId?: string,
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
      `/v1/users?${params}`,
    );

    return data.data;
  },

  /**
   * Asigna un usuario a un grupo
   */
  assignGroup: async (
    userId: string,
    groupId: string,
    role: string = "teacher",
  ): Promise<void> => {
    await api.post(`/v1/users/${userId}/groups`, { groupId, role });
  },

  /**
   * Crea un nuevo usuario
   */
  create: async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    const { data } = await api.post<ApiResponse<CreateUserResponse>>(
      "/v1/users",
      payload,
    );

    return data.data;
  },

  getProfile: async (): Promise<User> => {
    try {
      const { data } = await api.get<ApiResponse<User>>("/v1/users/profile/me");

      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        return { mustChangePassword: true } as unknown as User;
      }

      throw err;
    }
  },

  /**
   * Cambia el rol de un usuario
   */
  changeRole: async (id: string, role: UserRole): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/v1/users/${id}/role`,
      {
        role,
      },
    );

    return data.data;
  },

  /**
   * Cambia el estado de un usuario (activo/inactivo/pendiente)
   */
  changeStatus: async (id: string, status: UserStatus): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/v1/users/${id}/status`,
      { status },
    );

    return data.data;
  },

  /**
   * Elimina un usuario
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/v1/users/${id}`);
  },

  /**
   * Cambia la contraseña del usuario actual
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    await api.patch("/v1/users/me/password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Primer cambio de contraseña (sin contraseña actual)
   */
  firstPasswordChange: async (
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    await api.post("/v1/users/me/first-password-change", {
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Actualiza la imagen de perfil del usuario actual
   */
  updateProfileImage: async (profileImageUrl: string | null): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(
      "/v1/users/me/profile-image",
      {
        profileImageUrl,
      },
    );

    return data.data;
  },

  /**
   * Resetea la contraseña de un usuario por un administrador
   */
  adminResetPassword: async (
    userId: string,
  ): Promise<{ temporaryPassword: string }> => {
    const { data } = await api.post<ApiResponse<{ temporaryPassword: string }>>(
      `/v1/users/${userId}/reset-password`,
    );

    return data.data;
  },
};
