import { Toaster } from "@/components/ui/feedback/toaster";
import { Toaster as Sonner } from "@/components/ui/feedback/sonner";
import { TooltipProvider } from "@/components/ui/overlay/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/student/Dashboard";
import StudentExercises from "./pages/student/Exercises";
import StudentSubjects from "./pages/student/Subjects";
import StudentProgressPage from "./pages/student/Progress";
import StudentExerciseView from "./pages/student/ExerciseView";
import ProfessorDashboard from "./pages/professor/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import { AuthProvider } from "./context/AuthProvider";
import DashboardLayout from "./components/layout/DashboardLayout";

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
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route
                path="/dashboard/exercises"
                element={<StudentExercises />}
              />
              {/* NUEVAS RUTAS AÑADIDAS */}
              <Route path="/dashboard/subjects" element={<StudentSubjects />} />
              <Route
                path="/dashboard/progress"
                element={<StudentProgressPage />}
              />
              <Route
                path="/dashboard/submissions"
                element={<StudentProgressPage />}
              />{" "}
              {/* Alias por compatibilidad */}
              <Route
                path="/dashboard/exercise/:id"
                element={<StudentExerciseView />}
              />
              {/* Rutas de Profesor */}
              <Route path="/professor" element={<ProfessorDashboard />} />
              <Route path="/professor/*" element={<ProfessorDashboard />} />
              {/* Rutas de Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
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
