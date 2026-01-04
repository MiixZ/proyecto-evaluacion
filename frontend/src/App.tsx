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
import StudentExerciseView from "./pages/student/ExerciseView";
import StudentSubmissionsPage from "./pages/student/Submissions";
import { AuthProvider } from "./context/AuthProvider";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProfilePage from "./pages/student/Profile";
import DashboardWrapper from "./pages/DashboardWrapper"; // Importamos el wrapper

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
              {/* Ruta unificada para el Dashboard */}
              <Route path="/dashboard" element={<DashboardWrapper />} />

              {/* Rutas específicas de estudiante */}
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

              {/* Redirecciones de conveniencia para mantener compatibilidad */}
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
