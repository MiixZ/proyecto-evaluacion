import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, CheckCircle, Clock, Loader2 } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["professorStats"],
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

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase();
    switch (statusKey) {
      case "passed":
        return (
          <Badge variant="default">
            {t("dashboard.recent_activity.status.passed")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            {t("dashboard.recent_activity.status.failed")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {t("dashboard.recent_activity.status.pending")}
          </Badge>
        );
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

  const statCards = [
    {
      title: t("dashboard.stats.total_students"),
      value: stats?.totalStudents.toString() || "0",
      change: "",
      trend: { value: 0, isPositive: true },
      icon: <Users className="h-4 w-4" />,
      description: t("dashboard.stats.active_students_desc"),
    },
    {
      title: t("dashboard.stats.active_exercises"),
      value: stats?.activeExercises.toString() || "0",
      change: "",
      trend: { value: 0, isPositive: true },
      icon: <BookOpen className="h-4 w-4" />,
      description: t("dashboard.stats.active_exercises_desc"),
    },
    {
      title: t("dashboard.stats.pass_rate"),
      value: `${stats?.passRate || 0}%`,
      change: "",
      trend: {
        value: stats?.passRate || 0,
        isPositive: (stats?.passRate || 0) > 50,
      },
      icon: <CheckCircle className="h-4 w-4" />,
      description: t("dashboard.stats.pass_rate_desc"),
    },
    {
      title: t("dashboard.stats.pending_submissions"),
      value: stats?.pendingSubmissions.toString() || "0",
      change: "",
      trend: { value: 0, isPositive: true },
      icon: <Clock className="h-4 w-4" />,
      description: t("dashboard.stats.pending_submissions_desc"),
    },
  ];

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
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
                    <TableHead>{t("dashboard.table.exercise")}</TableHead>
                    <TableHead>{t("dashboard.table.group")}</TableHead>
                    <TableHead>{t("dashboard.table.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("dashboard.table.date")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.studentName || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {submission.exerciseTitle || "Untitled"}
                      </TableCell>
                      <TableCell>
                        {submission.groupName || "No Group"}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.pending_tasks")}</CardTitle>
            <CardDescription>
              {t("dashboard.pending_tasks_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                {t("dashboard.no_pending_tasks")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
