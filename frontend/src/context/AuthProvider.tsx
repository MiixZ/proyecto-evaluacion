import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { LoginFormValues } from "@/schemas/auth.schema";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");
    let storedUser: User | null = null;

    try {
      if (storedUserStr) {
        storedUser = JSON.parse(storedUserStr);
        // Sincronizar idioma al cargar usuario
        if (storedUser?.preferredLanguage) {
          i18n.changeLanguage(storedUser.preferredLanguage);
        }
      }
    } catch (e) {
      console.error("Error parsing stored user", e);
    }

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, [i18n]);

  const login = async (credentials: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Sincronizar idioma al hacer login
      if (data.user.preferredLanguage) {
        i18n.changeLanguage(data.user.preferredLanguage);
      }

      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Restaurar idioma por defecto al cerrar sesión
    i18n.changeLanguage("es");
    navigate("/login");
  };

  const refreshUser = async () => {
    try {
      const currentToken = token || localStorage.getItem("token");
      if (!currentToken) return;

      const updatedUser = await authService.getCurrentUserFromAPI();

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Sincronizar idioma al actualizar usuario
      if (updatedUser.preferredLanguage) {
        i18n.changeLanguage(updatedUser.preferredLanguage);
      }
    } catch (error) {
      console.error("Error reloading user:", error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
