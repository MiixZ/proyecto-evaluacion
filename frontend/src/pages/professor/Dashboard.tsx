import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  AlertTriangle,
  Activity,
  Loader2,
  ChevronRight,
  GraduationCap,
  Search,
  UserPlus,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Badge } from "@/components/ui/data/badge";
import { Progress } from "@/components/ui/feedback/progress";
import { Alert, AlertDescription } from "@/components/ui/feedback/alert";
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/forms/button";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { dashboardService } from "@/services/dashboard.service";
import { toast } from "sonner";

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    localStorage.getItem("professorLastGroupId") || undefined
  );

  const [studentFilter, setStudentFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["professorOverview", selectedGroupId],
    queryFn: () => dashboardService.getProfessorStats(selectedGroupId),
  });

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem("professorLastGroupId", selectedGroupId);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (
      !selectedGroupId &&
      dashboardData?.groups &&
      dashboardData.groups.length > 0
    ) {
      setSelectedGroupId(dashboardData.groups[0].groupId);
    }
  }, [dashboardData, selectedGroupId]);

  const handleExportData = () => {
    if (!dashboardData?.activeGroup) {
      toast.error(t("professor.dashboard.no_export_data"));
      return;
    }

    try {
      setIsExporting(true);
      const groupInfo = dashboardData.activeGroup.info;
      const students = dashboardData.activeGroup.students;

      const statsRows = [
        ["REPORTE DE GRUPO", groupInfo.groupName],
        ["Asignatura", groupInfo.subjectName],
        ["Fecha de emisión", new Date().toLocaleDateString("es-ES")],
        [""],
        ["MÉTRICAS GENERALES"],
        ["Nota Media del Grupo", groupInfo.avgScore.toFixed(2)],
        ["Porcentaje de Completitud", `${groupInfo.completionPercentage}%`],
        ["Total Estudiantes", groupInfo.studentCount],
        [
          "Alertas de Plagio (último mes)",
          dashboardData.activeGroup.plagiarismAlerts.length,
        ],
        [""],
        ["DETALLE DE ESTUDIANTES"],
      ];

      const tableHeaders = [
        "ID Estudiante",
        "Nombre",
        "Email",
        "Estado",
        "Progreso (%)",
        "Nota Media",
      ];

      const tableRows = students.map((student) => [
        student.id,
        `"${student.name.replace(/"/g, '""')}"`,
        student.email,
        student.status === "active"
          ? "Activo"
          : student.status === "risk"
          ? "Riesgo"
          : "Inactivo",
        student.progress.toFixed(2),
        student.averageScore.toFixed(2),
      ]);

      const csvArray = [...statsRows, tableHeaders, ...tableRows];

      const csvContent = csvArray.map((row) => row.join(",")).join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const safeGroupName = groupInfo.groupName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `reporte_${safeGroupName}_${timestamp}.csv`;

      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("professor.dashboard.export_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("professor.dashboard.export_error"));
    } finally {
      setIsExporting(false);
    }
  };
  // -----------------------------------

  if (isLoading && !dashboardData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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

  const activeGroup = dashboardData?.activeGroup;
  const groups = dashboardData?.groups || [];

  if (!activeGroup) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t("professor.dashboard.no_groups")}
      </div>
    );
  }

  // Filtrado de estudiantes
  const filteredStudents = activeGroup.students.filter(
    (student) =>
      student.name.toLowerCase().includes(studentFilter.toLowerCase()) ||
      student.email.toLowerCase().includes(studentFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER: Título y Acciones */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            {t("professor.dashboard.panel_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("professor.dashboard.group_info", {
              groupName: activeGroup.info.groupName,
              subjectName: activeGroup.info.subjectName,
              count: activeGroup.info.studentCount,
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Botones de Acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() =>
                navigate("/dashboard/groups", {
                  state: {
                    openAddStudent: true,
                    selectedGroupId: selectedGroupId,
                  },
                })
              }>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("professor.dashboard.add_student")}
            </Button>

            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleExportData}
              disabled={isExporting || isLoading}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting
                ? t("professor.dashboard.exporting")
                : t("professor.dashboard.export_data")}
            </Button>
          </div>

          {/* Selector de Grupo */}
          <div className="w-full sm:w-[300px]">
            <Select
              value={selectedGroupId}
              onValueChange={(value) => setSelectedGroupId(value)}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("professor.dashboard.select_group")}
                />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.groupName} - {g.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* METRICAS RAPIDAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("professor.dashboard.stats.avg_score")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.info.avgScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("professor.dashboard.stats.avg_score_desc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("professor.dashboard.stats.course_progress")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.info.completionPercentage}%
            </div>
            <Progress
              value={activeGroup.info.completionPercentage}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("professor.dashboard.stats.plagiarism_alerts")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.plagiarismAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("professor.dashboard.stats.plagiarism_desc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("professor.dashboard.stats.recent_activity")}
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.recentActivity.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("professor.dashboard.stats.recent_activity_desc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* PANEL CENTRAL: Lista de Estudiantes */}
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>{t("professor.dashboard.students_group")}</CardTitle>
                <CardDescription>
                  {t("professor.dashboard.students_group_desc")}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("professor.dashboard.search_student")}
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <ScrollArea className="h-[600px] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("professor.dashboard.student_column")}
                    </TableHead>
                    <TableHead>
                      {t("professor.dashboard.status_column")}
                    </TableHead>
                    <TableHead>
                      {t("professor.dashboard.progress_column")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("professor.dashboard.avg_score_column")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatarUrl || ""} />
                            <AvatarFallback>
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.status === "active" && (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800 hover:bg-green-100">
                              {t("professor.dashboard.status_active")}
                            </Badge>
                          )}
                          {student.status === "inactive" && (
                            <Badge variant="secondary">
                              {t("professor.dashboard.status_inactive")}
                            </Badge>
                          )}
                          {student.status === "risk" && (
                            <Badge variant="destructive">
                              {t("professor.dashboard.status_risk")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.progress}
                              className="h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(student.progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {student.averageScore.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground">
                        {t("professor.dashboard.no_students_found")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* PANEL DERECHO: Actividad y Alertas */}
        <div className="lg:col-span-3 space-y-6">
          {/* Actividad Reciente */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("professor.dashboard.recent_activity_title")}
              </CardTitle>
              <CardDescription>
                {t("professor.dashboard.recent_submissions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeGroup.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "error"
                          ? "bg-red-500"
                          : activity.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {activity.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        Hace{" "}
                        {formatDistanceToNow(new Date(activity.time), {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {activeGroup.recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("professor.dashboard.no_recent_activity")}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-6 text-xs text-muted-foreground hover:text-primary"
                size="sm"
                onClick={() =>
                  navigate(`/dashboard/group/${selectedGroupId}/activity`)
                }>
                {t("professor.dashboard.view_all_activity")}{" "}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Alertas de Plagio */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                {t("professor.dashboard.plagiarism_alerts_title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeGroup.plagiarismAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-sm font-medium text-orange-900 truncate">
                        {alert.studentName}
                      </p>
                      <p className="text-xs text-orange-700 truncate">
                        {alert.exerciseTitle}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-white text-orange-700 border-orange-200 shrink-0 ml-2">
                      {alert.similarity}%
                    </Badge>
                  </div>
                ))}
                {activeGroup.plagiarismAlerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {t("professor.dashboard.no_plagiarism")}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="link"
                  className="text-xs text-orange-700 h-auto p-0"
                  onClick={() =>
                    navigate(`/dashboard/group/${selectedGroupId}/plagiarism`)
                  }>
                  {t("professor.dashboard.view_all_cases")}{" "}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
