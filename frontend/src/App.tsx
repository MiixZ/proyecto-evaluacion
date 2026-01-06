import { Toaster } from "@/components/ui/feedback/toaster";
import { Toaster as Sonner } from "@/components/ui/feedback/sonner";
import { TooltipProvider } from "@/components/ui/overlay/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentExercises from "./pages/student/Exercises";
import StudentSubjects from "./pages/student/Subjects";
import StudentProgressPage from "./pages/student/Progress";
import GroupsPage from "./pages/professor/Groups";
import StudentExerciseView from "./pages/student/ExerciseView";
import StudentSubmissionsPage from "./pages/student/Submissions";
import { AuthProvider } from "./context/AuthProvider";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProfilePage from "./pages/student/Profile";
import DashboardWrapper from "./pages/DashboardWrapper";
import ActivityHistory from "./pages/professor/ActivityHistory";
import PlagiarismHistory from "./pages/professor/PlagiarismHistory";
import CreateExercise from "./pages/professor/CreateExercise";
import ExercisesList from "./pages/professor/ExerciseList";
import SubmissionDetails from "./pages/professor/SubmissionDetail";
import PlagiarismComparison from "./pages/professor/PlagiarismComparison";
import SubmissionComparison from "./pages/student/SubmissionComparison";
import UsersPage from "./pages/admin/Users";
import AcademicManagement from "./pages/admin/AcademicManagement";
import SecurityPage from "./pages/admin/Security";
import CourseMigration from "./pages/admin/CourseMigration";
import CourseDetail from "./pages/admin/CourseDetail";
import CourseViewer from "./pages/admin/CourseViewer";
import ManageSyllabi from "./pages/professor/ManageSyllabi";
import Unauthorized from "./pages/Unauthorized";
import RankingPage from "./pages/common/Ranking";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PasswordChangeGuard } from "./components/auth/PasswordChangeGuard";
import { UserRole } from "./types/auth.types";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PasswordChangeGuard>
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Rutas Protegidas */}
              <Route element={<DashboardLayout />}>
                {/* Dashboard principal - accesible por todos los autenticados */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <DashboardWrapper />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas de Estudiante - accesibles por estudiantes, profesores y admin */}
                <Route
                  path="/dashboard/exercises"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <StudentExercises />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/subjects"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <StudentSubjects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/progress"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <StudentProgressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/submissions"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <StudentSubmissionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/exercise/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <StudentExerciseView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ranking"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <RankingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/compare/:exerciseId"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        UserRole.STUDENT,
                        UserRole.TEACHER,
                        UserRole.ADMIN,
                      ]}>
                      <SubmissionComparison />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas de Profesor - solo profesores y admin */}
                <Route
                  path="/dashboard/groups"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <GroupsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/group/:groupId/activity"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <ActivityHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/group/:groupId/plagiarism"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <PlagiarismHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/create"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <CreateExercise />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/manage-exercises"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <ExercisesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/manage-syllabi"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <ManageSyllabi />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/edit-exercise/:exerciseId"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <CreateExercise />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submissions/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <SubmissionDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plagiarism/compare/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                      <PlagiarismComparison />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas de Admin - solo administradores */}
                <Route
                  path="/dashboard/users"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/degrees"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <AcademicManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/security"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <SecurityPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/course-migration"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <CourseMigration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/course-viewer"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <CourseViewer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/courses/:courseId"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                      <CourseDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Alias/Redirecciones */}
                <Route
                  path="/professor"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="/professor/*"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="/admin"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>

              {/* Ruta 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PasswordChangeGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
