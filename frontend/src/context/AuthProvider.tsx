import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserRole } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { LoginFormValues } from "@/schemas/auth.schema";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      switch (data.user.role) {
        case UserRole.STUDENT:
          navigate("/dashboard");
          break;
        case UserRole.PROFESSOR:
          navigate("/professor");
          break;
        case UserRole.ADMIN:
          navigate("/admin");
          break;
        default:
          navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  const refreshUser = async () => {
    try {
      const currentToken = token || localStorage.getItem("token");
      if (!currentToken) return;

      const updatedUser = await authService.getCurrentUserFromAPI();

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error reloading user:", error);
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
