import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/auth.types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Componente que protege rutas verificando:
 * 1. Si el usuario está autenticado
 * 2. Si el usuario tiene uno de los roles permitidos
 *
 * Si no cumple, redirige según corresponda:
 * - No autenticado → /login
 * - Autenticado pero sin permisos → /unauthorized
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Mostrar loader mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no tiene el rol apropiado, redirigir a unauthorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si tiene permisos, renderizar el contenido
  return <>{children}</>;
};
