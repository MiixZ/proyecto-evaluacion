import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { FirstPasswordChangeModal } from "@/components/common/FirstPasswordChangeModal";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

interface PasswordChangeGuardProps {
  children: React.ReactNode;
}

export function PasswordChangeGuard({ children }: PasswordChangeGuardProps) {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userService.getProfile(),
    enabled: !!user,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (profile?.mustChangePassword) {
      setShowModal(true);
    }
  }, [profile]);

  const handleSuccess = async () => {
    await refreshUser();
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showModal) {
    return <FirstPasswordChangeModal open={true} onSuccess={handleSuccess} />;
  }

  return <>{children}</>;
}
