import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

export default function ActivityHistory() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : es;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sorting, setSorting] = useState<{
    column: string;
    direction: "ASC" | "DESC";
  }>({ column: "date", direction: "DESC" });

  const { data, isLoading } = useQuery({
    queryKey: ["groupActivity", groupId, page, limit, sorting, filterStatus],
    queryFn: () =>
      dashboardService.getGroupActivity(
        groupId!,
        page,
        limit,
        sorting.column,
        sorting.direction,
        filterStatus
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default">Aceptado</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Incorrecto
          </Badge>
        );
      default:
        return <Badge variant="outline">Info</Badge>;
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
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de Actividad
          </h1>
          <p className="text-muted-foreground">
            Registro completo de entregas del grupo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Entregas</CardTitle>
              <CardDescription>
                Mostrando {data?.items.length || 0} de {data?.total || 0}{" "}
                registros
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por Estado */}
              <Select
                value={filterStatus}
                onValueChange={(val) => {
                  setFilterStatus(val);
                  setPage(1); // Reset page on filter
                }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="passed">Aceptados</SelectItem>
                  <SelectItem value="failed">Fallidos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>

              {/* Selector de Filas por página */}
              <Select
                value={limit.toString()}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por pág.</SelectItem>
                  <SelectItem value="10">10 por pág.</SelectItem>
                  <SelectItem value="20">20 por pág.</SelectItem>
                  <SelectItem value="50">50 por pág.</SelectItem>
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
                    Estudiante <SortIcon column="studentName" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("exerciseTitle")}>
                  <div className="flex items-center">
                    Acción <SortIcon column="exerciseTitle" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    Estado <SortIcon column="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("date")}>
                  <div className="flex items-center justify-end">
                    Fecha <SortIcon column="date" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.studentName}
                  </TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(activity.time), "PP p", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron resultados con los filtros actuales.
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
