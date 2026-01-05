import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

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

export default function PlagiarismHistory() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterType, setFilterType] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [sorting, setSorting] = useState<{
    column: string;
    direction: "ASC" | "DESC";
  }>({ column: "date", direction: "DESC" });

  const { data, isLoading } = useQuery({
    queryKey: [
      "groupPlagiarism",
      groupId,
      page,
      limit,
      sorting,
      filterType,
      reviewStatus,
    ],
    queryFn: () =>
      dashboardService.getGroupPlagiarism(
        groupId!,
        page,
        limit,
        sorting.column,
        sorting.direction,
        filterType,
        reviewStatus
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

  const SortIcon = ({ column }: { column: string }) => {
    if (sorting.column !== column)
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sorting.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  const getSimilarityBadge = (percent: number) => {
    if (percent >= 80) return <Badge variant="destructive">{percent}%</Badge>;
    if (percent >= 50)
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">{percent}%</Badge>
      );
    return <Badge variant="secondary">{percent}%</Badge>;
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
          {t("plagiarism.history.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-orange-700 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            {t("plagiarism.history.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("plagiarism.history.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t("plagiarism.history.list_title")}</CardTitle>
              <CardDescription>
                {t("plagiarism.history.showing", {
                  count: data?.items.length || 0,
                  total: data?.total || 0,
                })}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por Estado */}
              <Select
                value={reviewStatus}
                onValueChange={(val) => {
                  setReviewStatus(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue
                    placeholder={t("plagiarism.history.filter_status")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("plagiarism.history.filter_all")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {t("plagiarism.history.filter_pending")}
                  </SelectItem>
                  <SelectItem value="reviewed">
                    {t("plagiarism.history.filter_reviewed")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por Tipo */}
              <Select
                value={filterType}
                onValueChange={(val) => {
                  setFilterType(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={t("plagiarism.history.filter_type")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("plagiarism.history.filter_all_types")}
                  </SelectItem>
                  <SelectItem value="internal">
                    {t("plagiarism.history.filter_internal")}
                  </SelectItem>
                  <SelectItem value="external">
                    {t("plagiarism.history.filter_external")}
                  </SelectItem>
                  <SelectItem value="ai_generated">
                    {t("plagiarism.history.filter_ai")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Selector de Filas */}
              <Select
                value={limit.toString()}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("plagiarism.history.rows")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">
                    5 {t("plagiarism.history.per_page")}
                  </SelectItem>
                  <SelectItem value="10">
                    10 {t("plagiarism.history.per_page")}
                  </SelectItem>
                  <SelectItem value="20">
                    20 {t("plagiarism.history.per_page")}
                  </SelectItem>
                  <SelectItem value="50">
                    50 {t("plagiarism.history.per_page")}
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("studentName")}>
                  <div className="flex items-center">
                    {t("plagiarism.history.table.student")}{" "}
                    <SortIcon column="studentName" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("exerciseTitle")}>
                  <div className="flex items-center">
                    {t("plagiarism.history.table.exercise")}{" "}
                    <SortIcon column="exerciseTitle" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("type")}>
                  <div className="flex items-center">
                    {t("plagiarism.history.table.type")}{" "}
                    <SortIcon column="type" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("similarity")}>
                  <div className="flex items-center">
                    {t("plagiarism.history.table.similarity")}{" "}
                    <SortIcon column="similarity" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("date")}>
                  <div className="flex items-center justify-end">
                    {t("plagiarism.history.table.date")}{" "}
                    <SortIcon column="date" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  {t("plagiarism.history.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={alert.isReviewed ? "bg-muted/30 opacity-70" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {alert.isReviewed ? (
                        <span title={t("plagiarism.history.reviewed")}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </span>
                      ) : (
                        <div
                          className="h-2 w-2 rounded-full bg-orange-500"
                          title={t("plagiarism.history.pending")}
                        />
                      )}
                      {alert.studentName}
                    </div>
                  </TableCell>
                  <TableCell>{alert.exerciseTitle}</TableCell>
                  <TableCell className="capitalize">
                    {alert.type === "ai_generated"
                      ? t("plagiarism.history.type_ai")
                      : alert.type === "internal"
                      ? t("plagiarism.history.type_internal")
                      : t("plagiarism.history.type_external")}
                  </TableCell>
                  <TableCell>{getSimilarityBadge(alert.similarity)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(alert.date), "PP", { locale: dateLocale })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={alert.isReviewed ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        navigate(`/plagiarism/compare/${alert.id}`)
                      }>
                      <Eye className="h-4 w-4 mr-2" />
                      {alert.isReviewed
                        ? t("plagiarism.history.view_detail")
                        : t("plagiarism.history.review")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground">
                    {t("plagiarism.history.no_cases")}
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
