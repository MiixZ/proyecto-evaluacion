/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  FileCode,
  FileJson,
  X,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileArchive,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/data/badge";
import {
  ServerDataTable,
  ColumnDef,
  SortState,
} from "@/components/ui/data/server-data-table";
import { Input } from "@/components/ui/forms/input";
import { dashboardService } from "@/services/dashboard.service";
import { syllabusService } from "@/services/syllabus.service";
import { exportService } from "@/services/export.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay/dropdown-menu";

export default function ActivityHistory() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const studentIdParam = searchParams.get("studentId");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [sorting, setSorting] = useState<SortState>({
    column: "date",
    direction: "DESC",
  });

  const [selectedSyllabusId, setSelectedSyllabusId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Professor Groups for filtering
  const { data: dashboardData } = useQuery({
    queryKey: ["professorStats"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = dashboardData?.groups || [];
  const selectedGroup = groups.find((g) => g.groupId === groupId);

  // Fetch Syllabi for the current group's course
  const { data: syllabi = [] } = useQuery({
    queryKey: ["syllabi", selectedGroup?.courseId],
    queryFn: () => syllabusService.getByCourse(selectedGroup!.courseId),
    enabled: !!selectedGroup?.courseId,
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportActivity = async (format: "json" | "csv") => {
    if (!groupId) return;
    try {
      setIsExporting(true);
      await exportService.downloadGroupStatistics(
        groupId,
        `activity_${groupId}`,
        format,
      );
      toast.success(
        t("activity_history.export_success", "Exportación completada"),
      );
    } catch (error) {
      console.error(error);
      toast.error(t("activity_history.export_error", "Error al exportar"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSubmissionsZip = async () => {
    if (!groupId) return;
    try {
      setIsExporting(true);
      await exportService.downloadSubmissionsZip(groupId, {
        studentIds: studentIdParam ? [studentIdParam] : undefined,
      });
      toast.success(
        t("activity_history.export_success", "Exportación completada"),
      );
    } catch (error) {
      console.error(error);
      toast.error(t("activity_history.export_error", "Error al exportar"));
    } finally {
      setIsExporting(false);
    }
  };

  const { data: rawData, isLoading } = useQuery({
    queryKey: [
      "groupActivity",
      groupId,
      page,
      limit,
      sorting,
      studentIdParam,
      selectedSyllabusId,
      debouncedSearch,
    ],
    queryFn: () =>
      dashboardService.getGroupActivity(
        groupId!,
        page,
        limit,
        sorting.column,
        sorting.direction,
        undefined,
        studentIdParam || undefined,
        selectedSyllabusId,
        debouncedSearch,
      ),
    enabled: !!groupId,
  });

  const data = rawData
    ? {
        ...rawData,
        items:
          filterVerdict === "all"
            ? rawData.items
            : filterVerdict === "accepted"
              ? rawData.items.filter((item: any) => item.verdict === "accepted")
              : rawData.items.filter(
                  (item: any) => item.verdict !== "accepted",
                ),
        total:
          filterVerdict === "all"
            ? rawData.total
            : filterVerdict === "accepted"
              ? rawData.items.filter((item: any) => item.verdict === "accepted")
                  .length
              : rawData.items.filter((item: any) => item.verdict !== "accepted")
                  .length,
      }
    : undefined;

  const handleSort = (column: string, direction: "ASC" | "DESC") => {
    setSorting({ column, direction });
    setPage(1);
  };

  const handleDownload = async (
    submissionId: string,
    format: "zip" | "json",
  ) => {
    try {
      setDownloadingId(submissionId);
      toast.info(t("activity_history.download.starting"));
      await exportService.downloadSubmission(submissionId, format);
      toast.success(t("activity_history.download.success"));
    } catch (error) {
      console.error(error);
      toast.error(t("activity_history.download.error"));
    } finally {
      setDownloadingId(null);
    }
  };

  const clearStudentFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("studentId");
    setSearchParams(newParams);
    setPage(1);
  };

  const getStatusBadge = (verdict: string) => {
    switch (verdict) {
      case "accepted":
        return (
          <Badge variant="default">
            {t("activity_history.status.accepted")}
          </Badge>
        );
      case "wrong_answer":
      case "runtime_error":
      case "compilation_error":
        return (
          <Badge variant="destructive">
            {t("activity_history.status.error")}
          </Badge>
        );
      case "time_limit_exceeded":
      case "memory_limit_exceeded":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {t("activity_history.status.incorrect")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline">
            {t("activity_history.status.pending")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {verdict || t("activity_history.status.info")}
          </Badge>
        );
    }
  };

  const activityColumns: ColumnDef<any>[] = [
    {
      key: "studentName",
      label: t("activity_history.table.student"),
      sortable: true,
      className: "font-medium",
    },
    {
      key: "exerciseTitle",
      label: t("activity_history.table.exercise"),
      sortable: true,
      render: (activity) =>
        activity.exerciseTitle ||
        activity.action ||
        t("activity_history.generic_submission"),
    },
    {
      key: "verdict",
      label: t("activity_history.table.verdict", "Veredicto"),
      sortable: true,
      render: (activity) => getStatusBadge(activity.verdict),
    },
    {
      key: "date",
      label: t("activity_history.table.date"),
      sortable: true,
      render: (activity) => {
        if (!activity.time) return "-";
        try {
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(activity.time), "PP p", {
                locale: dateLocale,
              })}
            </div>
          );
        } catch {
          return "-";
        }
      },
    },
    {
      key: "actions",
      label: "",
      render: (activity) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">
                {t("activity_history.actions.menu")}
              </span>
              {downloadingId === activity.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {t("activity_history.actions.title")}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleDownload(activity.id, "zip")}>
              <FileCode className="mr-2 h-4 w-4" />
              {t("activity_history.actions.download_code")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDownload(activity.id, "json")}>
              <FileJson className="mr-2 h-4 w-4" />
              {t("activity_history.actions.download_json")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(`/submissions/${activity.id}`)}>
              {t("activity_history.actions.view_details")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("activity_history.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("activity_history.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("activity_history.subtitle_simple", {
              defaultValue: "Historial de actividad del grupo",
            })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting || isLoading}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t("activity_history.export_button", "Exportar")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExportActivity("csv")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t("activity_history.export_csv", "Exportar CSV")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportActivity("json")}>
              <FileJson className="mr-2 h-4 w-4" />
              {t("activity_history.export_json", "Exportar JSON")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportSubmissionsZip()}>
              <FileArchive className="mr-2 h-4 w-4" />
              {t("activity_history.export_zip", "Exportar Entregas (ZIP)")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* BANNER DE FILTRO ACTIVO */}
      {studentIdParam && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {t("activity_history.filter_active")}
            </span>
            <span className="text-xs opacity-90">
              {t(
                "activity_history.filter_student_only_simple",
                "Mostrando solo actividad de un estudiante",
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearStudentFilter}
            className="h-auto py-1 px-3 hover:bg-blue-100 text-blue-800 hover:text-blue-900 transition-colors">
            <X className="h-3 w-3 mr-2" />
            {t("activity_history.view_all")}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t("activity_history.submissions_title")}</CardTitle>
              <CardDescription>
                {t("activity_history.showing", {
                  count: data?.items.length || 0,
                  total: data?.total || 0,
                })}
              </CardDescription>
            </div>

            <Select
              value={filterVerdict}
              onValueChange={(val) => {
                setFilterVerdict(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={t(
                    "activity_history.filter_verdict",
                    "Veredicto",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("activity_history.filter_all", "Todos")}
                </SelectItem>
                <SelectItem value="accepted">
                  {t("activity_history.filter_accepted", "Aceptado")}
                </SelectItem>
                <SelectItem value="error">
                  {t("activity_history.filter_error", "Error")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Group Selector */}
            <div className="w-full md:w-[250px]">
              <Select
                value={groupId}
                onValueChange={(val) => navigate(`/groups/${val}/activity`)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "activity_history.select_group",
                      "Seleccionar grupo",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.groupId} value={g.groupId}>
                      {g.subjectName} ({g.groupName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Syllabus Filter */}
            <div className="w-full md:w-[250px]">
              <Select
                value={selectedSyllabusId}
                onValueChange={(val) => {
                  setSelectedSyllabusId(val);
                  setPage(1);
                }}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "activity_history.filter_syllabus",
                      "Filtrar por tema",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all_topics", "Todos los temas")}
                  </SelectItem>
                  {syllabi.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  "activity_history.search_placeholder",
                  "Buscar estudiante...",
                )}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ServerDataTable<any>
            data={data?.items || []}
            columns={activityColumns}
            totalItems={data?.total || 0}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
            onSortChange={handleSort}
            sortState={sorting}
            emptyMessage={t("activity_history.no_results")}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            loadingRows={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
