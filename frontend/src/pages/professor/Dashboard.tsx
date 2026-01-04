import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

import { StatCard } from "@/components/ui/data/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Badge } from "@/components/ui/data/badge";
import { Alert, AlertDescription } from "@/components/ui/feedback/alert";
import { Progress } from "@/components/ui/feedback/progress";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const {
    data: dashboardData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["professorOverview"],
    queryFn: dashboardService.getProfessorStats,
  });

  const {
    data: recentSubmissions,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useQuery({
    queryKey: ["recentSubmissions"],
    queryFn: () => dashboardService.getRecentSubmissions(5),
  });

  const getStatusBadge = (verdict: string | undefined, status: string) => {
    if (status !== "completed") {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          {t("dashboard.recent_activity.status.pending")}
        </Badge>
      );
    }

    switch (verdict) {
      case "accepted":
        return (
          <Badge variant="default">
            {t("dashboard.recent_activity.status.passed")}
          </Badge>
        );
      case "wrong_answer":
        return (
          <Badge variant="destructive">
            {t("dashboard.recent_activity.status.failed")}
          </Badge>
        );
      case "compilation_error":
        return <Badge variant="destructive">Error Comp.</Badge>;
      default:
        return <Badge variant="secondary">{verdict || status}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch (e) {
      return dateString;
    }
  };

  if (statsLoading || submissionsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (statsError || submissionsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("dashboard.error_loading_data")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { stats, groups, workload } = dashboardData || {
    stats: {},
    groups: [],
    workload: {},
  };

  const statCards = [
    {
      title: t("dashboard.stats.total_students"),
      value: stats?.totalStudents?.toString() || "0",
      change: "",
      trend: { value: 0, isPositive: true },
      icon: Users,
      description: t("dashboard.stats.active_students_desc"),
    },
    {
      title: t("dashboard.stats.active_exercises"),
      value: stats?.activeExercises?.toString() || "0",
      change: "",
      trend: { value: 0, isPositive: true },
      icon: BookOpen,
      description: t("dashboard.stats.active_exercises_desc"),
    },
    {
      title: t("dashboard.stats.pass_rate"),
      value: `${stats?.avgCompletion || 0}%`,
      change: "",
      trend: {
        value: stats?.avgCompletion || 0,
        isPositive: (stats?.avgCompletion || 0) > 50,
      },
      icon: CheckCircle,
      description: t("dashboard.stats.pass_rate_desc"),
    },
    {
      title: t("dashboard.stats.pending_submissions"),
      value: (
        (stats?.pendingEvaluation || 0) + (stats?.pendingFeedback || 0)
      ).toString(),
      change: "",
      trend: {
        value: (stats?.pendingEvaluation || 0) + (stats?.pendingFeedback || 0),
        isPositive: (stats?.pendingEvaluation || 0) === 0,
      },
      icon: Clock,
      description: t("dashboard.stats.pending_submissions_desc"),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome", { name: user?.firstName })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcome_subtitle_professor")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return <StatCard key={index} {...stat} icon={<Icon />} />;
        })}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Tabla de Entregas Recientes */}
        <Card className="col-span-1 lg:col-span-4 h-full">
          <CardHeader>
            <CardTitle>{t("dashboard.recent_submissions")}</CardTitle>
            <CardDescription>
              {t("dashboard.recent_submissions_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions && recentSubmissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.table.student")}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("dashboard.table.exercise")}
                    </TableHead>
                    <TableHead>{t("dashboard.table.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("dashboard.table.date")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="font-medium">
                          {submission.studentName || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {submission.exerciseTitle}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {submission.groupName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {submission.exerciseTitle || "Untitled"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.verdict, submission.status)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(submission.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                {t("dashboard.no_submissions")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna Derecha: Pendientes y Grupos */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          {/* Card: Tareas Pendientes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                {t("dashboard.pending_tasks")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      Ejercicios por corregir
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pendientes de evaluación manual o revisión
                    </p>
                  </div>
                </div>
                <div className="font-bold">
                  {workload?.pendingEvaluation || 0}
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      Feedback pendiente
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comentarios no leídos o respuestas requeridas
                    </p>
                  </div>
                </div>
                <div className="font-bold">
                  {workload?.pendingFeedback || 0}
                </div>
              </div>

              {!workload?.pendingEvaluation && !workload?.pendingFeedback && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ¡Todo al día! No hay tareas pendientes.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card: Rendimiento por Grupos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Rendimiento por Grupos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <div key={group.groupId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{group.groupName}</span>
                      <span className="text-muted-foreground">
                        {group.avgScore.toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={group.completionPercentage}
                        className="h-2"
                      />
                      <span className="text-xs w-[3rem] text-right text-muted-foreground">
                        {Math.round(group.completionPercentage)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.subjectName} • {group.studentCount} estudiantes
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No hay grupos asignados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
