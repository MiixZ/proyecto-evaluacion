import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/auth.types";
import StudentDashboard from "@/pages/student/Dashboard";
import ProfessorDashboard from "@/pages/professor/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import { Navigate } from "react-router-dom";

export default function DashboardWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.TEACHER:
      return <ProfessorDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.STUDENT:
    default:
      return <StudentDashboard />;
  }
}
