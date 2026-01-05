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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardWrapper />} />

              {/* Estudiante */}
              <Route
                path="/dashboard/exercises"
                element={<StudentExercises />}
              />
              <Route path="/dashboard/subjects" element={<StudentSubjects />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route
                path="/dashboard/progress"
                element={<StudentProgressPage />}
              />
              <Route
                path="/dashboard/submissions"
                element={<StudentSubmissionsPage />}
              />
              <Route
                path="/dashboard/exercise/:id"
                element={<StudentExerciseView />}
              />

              <Route
                path="/dashboard/compare/:exerciseId"
                element={<SubmissionComparison />}
              />

              {/* Profesor */}
              <Route
                path="/dashboard/group/:groupId/activity"
                element={<ActivityHistory />}
              />
              <Route
                path="/dashboard/group/:groupId/plagiarism"
                element={<PlagiarismHistory />}
              />
              <Route path="/dashboard/groups" element={<GroupsPage />} />
              <Route path="/dashboard/create" element={<CreateExercise />} />
              <Route
                path="/dashboard/manage-exercises"
                element={<ExercisesList />}
              />
              <Route
                path="/dashboard/edit-exercise/:exerciseId"
                element={<CreateExercise />}
              />
              <Route path="/submissions/:id" element={<SubmissionDetails />} />
              <Route
                path="/plagiarism/compare/:id"
                element={<PlagiarismComparison />}
              />

              {/* Admin */}
              <Route path="/dashboard/users" element={<UsersPage />} />
              <Route
                path="/dashboard/degrees"
                element={<AcademicManagement />}
              />
              <Route path="/dashboard/security" element={<SecurityPage />} />

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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
