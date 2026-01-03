import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileCode,
  CheckCircle2,
  Clock,
  TrendingUp,
  BookOpen,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { StatCard } from "@/components/ui/data/stat-card";
import {
  ExerciseCard,
  ExerciseDifficulty,
  ExerciseStatus,
} from "@/components/ui/data/exercise-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Progress } from "@/components/ui/feedback/progress";
import { Button } from "@/components/ui/forms/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { studentService } from "@/services/student.service";
import { useAuth } from "@/hooks/use-auth";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentProgress"],
    queryFn: studentService.getProgress,
  });

  const totalExercises = progressData?.length || 0;
  const completedExercises =
    progressData?.filter((p) => p.isCompleted).length || 0;
  const pendingExercises = totalExercises - completedExercises;

  const attemptedExercises = progressData?.filter((p) => p.attempts > 0) || [];
  const averageScore =
    attemptedExercises.length > 0
      ? Math.round(
          attemptedExercises.reduce((acc, curr) => acc + curr.bestScore, 0) /
            attemptedExercises.length
        )
      : 0;

  const subjectsMap =
    progressData?.reduce((acc, curr) => {
      if (!acc[curr.subjectName]) {
        acc[curr.subjectName] = { total: 0, completed: 0 };
      }
      acc[curr.subjectName].total += 1;
      if (curr.isCompleted) acc[curr.subjectName].completed += 1;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>) || {};

  const subjectProgress = Object.entries(subjectsMap).map(([name, stats]) => ({
    name,
    total: stats.total,
    completed: stats.completed,
    progress:
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));

  const mapDifficulty = (diff: string): ExerciseDifficulty => {
    const map: Record<string, ExerciseDifficulty> = {
      beginner: "easy",
      intermediate: "medium",
      advanced: "hard",
    };

    return map[diff] || "medium";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatus = (ex: any): ExerciseStatus => {
    if (ex.isCompleted) return "completed";
    if (ex.attempts > 0 && !ex.isCompleted) return "failed";

    return "pending";
  };

  const recentExercises = [...(progressData || [])]
    .sort((a, b) => {
      const dateA = a.lastAttempt ? new Date(a.lastAttempt).getTime() : 0;
      const dateB = b.lastAttempt ? new Date(b.lastAttempt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3)
    .map((ex) => ({
      id: ex.exerciseId,
      title: ex.exerciseTitle,
      description: ex.subjectName,
      difficulty: mapDifficulty(ex.difficulty),
      status: getStatus(ex),
      attempts: ex.attempts,
      dueDate: ex.deadline ? ex.deadline : undefined,
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos. Intenta recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome", { name: user?.firstName || "Estudiante" })}
        </h1>
        <p className="text-muted-foreground">
          {pendingExercises > 0
            ? `Tienes ${pendingExercises} ejercicios pendientes esta semana.`
            : "¡Todo al día! Has completado todos tus ejercicios."}
        </p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ejercicios Completados"
          value={completedExercises}
          description={`de ${totalExercises} totales`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Tasa de Acierto"
          value={`${averageScore}%`}
          description="puntuación media"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Pendientes"
          value={pendingExercises}
          description="por realizar"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Racha Actual"
          value="3 días"
          description="¡Sigue así!"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna Principal: Ejercicios Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              Actividad Reciente
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/exercises">Ver todos</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentExercises.length > 0 ? (
              recentExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} {...exercise} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mb-4 opacity-20" />
                  <p>Aún no tienes actividad reciente.</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/dashboard/exercises">Explorar ejercicios</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Columna Lateral: Progreso por Asignatura */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Progreso por Asignatura
          </h2>

          <div className="space-y-4">
            {subjectProgress.map((subject) => (
              <Card key={subject.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="font-medium text-sm truncate pr-2"
                      title={subject.name}>
                      {subject.name}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {subject.completed}/{subject.total}
                    </span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </CardContent>
              </Card>
            ))}

            {subjectProgress.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No estás matriculado en asignaturas activas.
              </p>
            )}

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild>
                  <Link to="/dashboard/exercises">
                    <FileCode className="h-4 w-4 mr-2" />
                    Resolver Ejercicios
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild>
                  <Link to="/dashboard/profile">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Perfil Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
