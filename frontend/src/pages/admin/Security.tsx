import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Shield,
  Search,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

import { auditService, AuditLog, AuditFilters } from "@/services/audit.service";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
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

export default function SecurityPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AuditFilters>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["auditLogs", page, limit, filters],
    queryFn: () => auditService.getAuditLogs(page, limit, filters),
  });

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === "es" ? es : enUS;
    return format(date, "PPp", { locale });
  };

  const formatUser = (log: AuditLog) => {
    if (!log.userId) {
      return t("security.system");
    }
    // Si hay email en changes, mostrarlo
    if (
      log.changes &&
      typeof log.changes === "object" &&
      "email" in log.changes
    ) {
      return log.changes.email as string;
    }
    // Si no, mostrar primeros 8 caracteres del UUID
    return log.userId.substring(0, 8) + "...";
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      CREATE:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      LOGIN:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      EXPORT:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    return (
      <Badge className={actionColors[action] || ""} variant="secondary">
        {t(`security.actions.${action}`) || action}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{t("security.error")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t("security.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("security.subtitle")}</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            {t("security.filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de Entidad */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("security.filters.entity_type")}
              </label>
              <Select
                value={filters.entityType || "all"}
                onValueChange={(value) =>
                  handleFilterChange("entityType", value)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("security.filters.all_entities")}
                  </SelectItem>
                  <SelectItem value="user">
                    {t("security.entities.user")}
                  </SelectItem>
                  <SelectItem value="exercise">
                    {t("security.entities.exercise")}
                  </SelectItem>
                  <SelectItem value="submission">
                    {t("security.entities.submission")}
                  </SelectItem>
                  <SelectItem value="group">
                    {t("security.entities.group")}
                  </SelectItem>
                  <SelectItem value="course">
                    {t("security.entities.course")}
                  </SelectItem>
                  <SelectItem value="subject">
                    {t("security.entities.subject")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("security.filters.action")}
              </label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("security.filters.all_actions")}
                  </SelectItem>
                  <SelectItem value="CREATE">
                    {t("security.actions.CREATE")}
                  </SelectItem>
                  <SelectItem value="UPDATE">
                    {t("security.actions.UPDATE")}
                  </SelectItem>
                  <SelectItem value="DELETE">
                    {t("security.actions.DELETE")}
                  </SelectItem>
                  <SelectItem value="LOGIN">
                    {t("security.actions.LOGIN")}
                  </SelectItem>
                  <SelectItem value="EXPORT">
                    {t("security.actions.EXPORT")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Inicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("security.filters.start_date")}
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("security.filters.end_date")}
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              {t("security.filters.clear_filters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>
              {data?.total || 0} {t("security.table.no_logs")} encontrados
            </CardDescription>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("security.search_placeholder")}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    {t("security.table.date")}
                  </TableHead>
                  <TableHead>{t("security.table.user")}</TableHead>
                  <TableHead>{t("security.table.action")}</TableHead>
                  <TableHead>{t("security.table.entity")}</TableHead>
                  <TableHead>{t("security.table.entity_id")}</TableHead>
                  <TableHead className="text-right">
                    {t("security.table.changes")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items && data.items.length > 0 ? (
                  data.items.map((log: AuditLog) => (
                    <>
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatUser(log)}</span>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entityType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.entityId?.substring(0, 8) || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.changes ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(log.id)}>
                              {expandedRows.has(log.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  {t("security.table.hide_changes")}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  {t("security.table.show_changes")}
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t("security.table.no_changes")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && log.changes && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <pre className="text-xs overflow-auto p-4 rounded bg-background">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground">
                      {t("security.table.no_logs")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}>
                {t("common.previous")}
              </Button>
              <div className="text-sm text-muted-foreground">
                {t("common.page")} {page} {t("common.of")} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
