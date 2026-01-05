import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  History,
  GitBranch,
  Loader2,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Badge } from "@/components/ui/data/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { academicService } from "@/services/academic.service";
import { toast } from "sonner";
import { MigrationDialog } from "./components/MigrationDialog";

export default function CourseMigration() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [selectedSourceCourse, setSelectedSourceCourse] = useState<string>("");

  // Obtener asignaturas
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  // Obtener historial de cursos para la asignatura seleccionada
  const {
    data: courseHistory = [],
    isLoading: loadingHistory,
    refetch,
  } = useQuery({
    queryKey: ["courseHistory", selectedSubject],
    queryFn: () => academicService.getCourseHistory(selectedSubject),
    enabled: !!selectedSubject,
  });

  const handleMigrate = (sourceCourseId: string) => {
    setSelectedSourceCourse(sourceCourseId);
    setMigrationDialogOpen(true);
  };

  // Filtrar cursos
  const filteredCourses = courseHistory.filter((course) => {
    const matchesYear =
      filterYear === "all" || course.academic_year === filterYear;
    const matchesStatus =
      filterStatus === "all" || course.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      course.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.academic_year.includes(searchTerm);
    return matchesYear && matchesStatus && matchesSearch;
  });

  // Obtener años académicos únicos
  const academicYears = Array.from(
    new Set(courseHistory.map((c) => c.academic_year))
  )
    .sort()
    .reverse();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      active: { variant: "default", label: t("admin.courses.status.active") },
      planning: {
        variant: "secondary",
        label: t("admin.courses.status.planning"),
      },
      closed: { variant: "outline", label: t("admin.courses.status.closed") },
      archived: {
        variant: "destructive",
        label: t("admin.courses.status.archived"),
      },
    };

    const config = statusMap[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            {t("admin.courses.migration.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.courses.migration.subtitle")}
          </p>
        </div>
      </div>

      {/* Selector de asignatura */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.courses.migration.selectSubject")}</CardTitle>
          <CardDescription>
            {t("admin.courses.migration.selectSubjectDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t(
                  "admin.courses.migration.selectSubjectPlaceholder"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Historial de cursos */}
      {selectedSubject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("admin.courses.migration.history")}</CardTitle>
                <CardDescription>
                  {t("admin.courses.migration.historyDesc", {
                    count: filteredCourses.length,
                  })}
                </CardDescription>
              </div>
            </div>
            {/* Filtros */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.courses.migration.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={t("admin.courses.migration.filterYear")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.courses.migration.allYears")}
                  </SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={t("admin.courses.migration.filterStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.courses.migration.allStatus")}
                  </SelectItem>
                  <SelectItem value="planning">
                    {t("admin.courses.status.planning")}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("admin.courses.status.active")}
                  </SelectItem>
                  <SelectItem value="closed">
                    {t("admin.courses.status.closed")}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t("admin.courses.status.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("admin.courses.migration.noCourses")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("admin.courses.migration.table.academicYear")}
                    </TableHead>
                    <TableHead>
                      {t("admin.courses.migration.table.semester")}
                    </TableHead>
                    <TableHead>
                      {t("admin.courses.migration.table.status")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.courses.migration.table.syllabi")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.courses.migration.table.exercises")}
                    </TableHead>
                    <TableHead>
                      {t("admin.courses.migration.table.dates")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.courses.migration.table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.academic_year}
                      </TableCell>
                      <TableCell>
                        {t("admin.courses.migration.semesterLabel", {
                          number: course.semester,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell className="text-right">
                        {course.syllabi_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {course.exercises_count}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {course.start_date && course.end_date
                          ? `${new Date(
                              course.start_date
                            ).toLocaleDateString()} - ${new Date(
                              course.end_date
                            ).toLocaleDateString()}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/dashboard/courses/${course.id}`)
                            }>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("admin.courses.migration.viewDetail")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMigrate(course.id)}
                            disabled={
                              course.syllabi_count === 0 &&
                              course.exercises_count === 0
                            }>
                            <GitBranch className="h-4 w-4 mr-2" />
                            {t("admin.courses.migration.migrateButton")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de migración */}
      <MigrationDialog
        open={migrationDialogOpen}
        onOpenChange={setMigrationDialogOpen}
        sourceCourseId={selectedSourceCourse}
        availableCourses={courseHistory}
        onSuccess={() => {
          refetch();
          toast.success(t("admin.courses.migration.success"));
        }}
      />
    </div>
  );
}
