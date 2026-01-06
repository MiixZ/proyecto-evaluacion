import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { FirstPasswordChangeModal } from "@/components/common/FirstPasswordChangeModal";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

interface PasswordChangeGuardProps {
  children: React.ReactNode;
}

/**
 * Guard que verifica si el usuario debe cambiar su contraseña
 * Muestra un modal no dismissible hasta que complete el cambio
 */
export function PasswordChangeGuard({ children }: PasswordChangeGuardProps) {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Obtener perfil actualizado para verificar mustChangePassword
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userService.getProfile(),
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profile?.mustChangePassword) {
      setShowModal(true);
    }
  }, [profile]);

  const handleSuccess = async () => {
    // Refrescar usuario para actualizar el flag
    await refreshUser();
    setShowModal(false);
  };

  if (showModal) {
    return <FirstPasswordChangeModal open={true} onSuccess={handleSuccess} />;
  }
  return <>{children}</>;
}
