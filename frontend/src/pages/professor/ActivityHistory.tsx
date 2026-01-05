/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Badge } from "@/components/ui/data/badge";
import { dashboardService } from "@/services/dashboard.service";
import { exportService } from "@/services/export.service";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/data/pagination";
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
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sorting, setSorting] = useState<{
    column: string;
    direction: "ASC" | "DESC";
  }>({ column: "date", direction: "DESC" });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      "groupActivity",
      groupId,
      page,
      limit,
      sorting,
      filterStatus,
      studentIdParam,
    ],
    queryFn: () =>
      dashboardService.getGroupActivity(
        groupId!,
        page,
        limit,
        sorting.column,
        sorting.direction,
        filterStatus,
        studentIdParam || undefined
      ),
    enabled: !!groupId,
  });

  const handleSort = (column: string) => {
    setSorting((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "DESC" ? "ASC" : "DESC",
    }));
  };

  const handleDownload = async (
    submissionId: string,
    format: "zip" | "json"
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
    setPage(1); // Resetear a página 1 al quitar filtro
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sorting.column !== column)
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sorting.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return (
          <Badge variant="default">
            {t("activity_history.status.accepted")}
          </Badge>
        );
      case "error":
      case "failed":
        return (
          <Badge variant="destructive">
            {t("activity_history.status.error")}
          </Badge>
        );
      case "warning":
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
          <Badge variant="outline">{t("activity_history.status.info")}</Badge>
        );
    }
  };

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
            {t("activity_history.subtitle", {
              name: data?.group?.name || "",
              subject: data?.group?.subject?.name || "",
            })}
          </p>
        </div>
      </div>

      {/* BANNER DE FILTRO ACTIVO */}
      {studentIdParam && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {t("activity_history.filter_active")}
            </span>
            <span className="text-xs opacity-90">
              {t("activity_history.filter_student_only", {
                student:
                  data?.students?.find(
                    (s: any) => s.id.toString() === studentIdParam
                  )?.name || "",
              })}
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
                  start: (page - 1) * limit + 1,
                  end: Math.min(page * limit, data?.total || 0),
                  total: data?.total || 0,
                })}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filterStatus}
                onValueChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={t("activity_history.filter_status")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("activity_history.filter_all")}
                  </SelectItem>
                  <SelectItem value="passed">
                    {t("activity_history.filter_passed")}
                  </SelectItem>
                  <SelectItem value="failed">
                    {t("activity_history.filter_failed")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {t("activity_history.filter_pending")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={limit.toString()}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("activity_history.rows")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">
                    5 {t("activity_history.per_page")}
                  </SelectItem>
                  <SelectItem value="10">
                    10 {t("activity_history.per_page")}
                  </SelectItem>
                  <SelectItem value="20">
                    20 {t("activity_history.per_page")}
                  </SelectItem>
                  <SelectItem value="50">
                    50 {t("activity_history.per_page")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("studentName")}>
                  <div className="flex items-center">
                    {t("activity_history.table.student")}{" "}
                    <SortIcon column="studentName" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("exerciseTitle")}>
                  <div className="flex items-center">
                    {t("activity_history.table.exercise")}{" "}
                    <SortIcon column="exerciseTitle" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    {t("activity_history.table.status")}{" "}
                    <SortIcon column="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("date")}>
                  <div className="flex items-center justify-end">
                    {t("activity_history.table.date")}{" "}
                    <SortIcon column="date" />
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((activity: any) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.studentName}
                  </TableCell>
                  <TableCell>
                    {/* Fallback para mostrar título o acción genérica */}
                    {activity.exerciseTitle ||
                      activity.action ||
                      t("activity_history.generic_submission")}
                  </TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(activity.time), "PP p", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>
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
                          onClick={() =>
                            navigate(`/submissions/${activity.id}`)
                          }>
                          {t("activity_history.actions.view_details")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t("activity_history.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer">
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(data.totalPages, p + 1))
                      }
                      className={
                        page === data.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
