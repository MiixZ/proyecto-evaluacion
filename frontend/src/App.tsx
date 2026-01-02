import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/overlay/tooltip";
import { Toaster } from "@/components/ui/feedback/toaster";
import { Toaster as Sonner } from "@/components/ui/feedback/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import StudentDashboard from "@/pages/student/Dashboard";
import ExerciseView from "@/pages/student/ExerciseView";
import ProfessorDashboard from "@/pages/professor/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            {/* Aquí irían /about, /contact, etc. */}
          </Route>

          {/* Rutas Protegidas (Dashboard) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Redirección inteligente: Si entra a /dashboard pelado, decidir a dónde va */}
            <Route index element={<StudentDashboard />} />

            {/* Estudiante */}
            <Route path="exercise/:id" element={<ExerciseView />} />

            {/* Profesor */}
            <Route path="professor" element={<ProfessorDashboard />} />

            {/* Admin */}
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      {/* Global Toasters */}
      <Toaster />
      <Sonner position="top-right" />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
