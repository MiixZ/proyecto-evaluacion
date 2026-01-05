import api from "@/lib/api";
import { LoginResponse, User } from "@/types/auth.types";
import { LoginFormValues } from "@/schemas/auth.schema";

/**
 * Servicio de autenticación para login, logout y gestión de usuario actual
 */
export const authService = {
  /**
   * Autentica un usuario con email y contraseña
   * @param credentials - Credenciales de login
   * @returns Datos del usuario y token
   */
  login: async (
    credentials: LoginFormValues
  ): Promise<LoginResponse["data"]> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);

    return response.data.data;
  },

  /**
   * Cierra sesión eliminando token y datos del usuario
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * Obtiene el usuario actual desde localStorage
   * @returns Usuario o null si no está autenticado
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el usuario actual desde la API
   * @returns Datos actualizados del usuario
   */
  getCurrentUserFromAPI: async (): Promise<User> => {
    const response = await api.get<{ data: User }>("/auth/me");

    return response.data.data;
  },
};
