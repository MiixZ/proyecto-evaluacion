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
import { ScrollArea } from "@/components/ui/layout/scroll-area"; //
import { dashboardService } from "@/services/dashboard.service";

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "en" ? enUS : es;
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    undefined
  );
  const [studentFilter, setStudentFilter] = useState("");

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["professorOverview", selectedGroupId],
    queryFn: () => dashboardService.getProfessorStats(selectedGroupId),
  });

  useEffect(() => {
    if (
      !selectedGroupId &&
      dashboardData?.groups &&
      dashboardData.groups.length > 0
    ) {
      setSelectedGroupId(dashboardData.groups[0].groupId);
    }
  }, [dashboardData, selectedGroupId]);

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
        No tienes grupos asignados. Contacta con el administrador.
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
            Panel del Profesor
          </h1>
          <p className="text-muted-foreground">
            {activeGroup.info.groupName} - {activeGroup.info.subjectName} •{" "}
            {activeGroup.info.studentCount} estudiantes
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
                  state: { openAddStudent: true },
                })
              }>
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar estudiante
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Exportar datos
            </Button>
          </div>

          {/* Selector de Grupo */}
          <div className="w-full sm:w-[300px]">
            <Select
              value={selectedGroupId}
              onValueChange={(value) => setSelectedGroupId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grupo" />
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
              Nota Media Grupo
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.info.avgScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              sobre 10 puntos posibles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progreso Curso
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
              Alertas de Plagio
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.plagiarismAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Detectadas en el último mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actividad Reciente
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGroup.recentActivity.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Entregas en las últimas 24h
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
                <CardTitle>Estudiantes del Grupo</CardTitle>
                <CardDescription>
                  Progreso y estado de los alumnos matriculados
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 sm:pt-0">
            {" "}
            <ScrollArea className="h-[800px] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Nota Media</TableHead>
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
                              Activo
                            </Badge>
                          )}
                          {student.status === "inactive" && (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                          {student.status === "risk" && (
                            <Badge variant="destructive">Riesgo</Badge>
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
                        No se encontraron estudiantes.
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
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas entregas del grupo</CardDescription>
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
                    Sin actividad reciente.
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
                Ver toda la actividad <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Alertas de Plagio */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Plagio
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
                    No se han detectado plagios recientes.
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
                  Ver todos los casos <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
