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

  // Estados
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterType, setFilterType] = useState("all");
  const [sorting, setSorting] = useState<{
    column: string;
    direction: "ASC" | "DESC";
  }>({ column: "date", direction: "DESC" });

  const { data, isLoading } = useQuery({
    queryKey: ["groupPlagiarism", groupId, page, limit, sorting, filterType],
    queryFn: () =>
      dashboardService.getGroupPlagiarism(
        groupId!,
        page,
        limit,
        sorting.column,
        sorting.direction,
        filterType
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
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-orange-700 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Alertas de Plagio
          </h1>
          <p className="text-muted-foreground">Casos detectados en el grupo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Alertas</CardTitle>
              <CardDescription>
                Mostrando {data?.items.length || 0} de {data?.total || 0} casos
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por Tipo */}
              <Select
                value={filterType}
                onValueChange={(val) => {
                  setFilterType(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de plagio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="internal">Copia entre alumnos</SelectItem>
                  <SelectItem value="external">Fuente externa</SelectItem>
                  <SelectItem value="ai_generated">IA Generativa</SelectItem>
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("studentName")}>
                  <div className="flex items-center">
                    Estudiante <SortIcon column="studentName" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("exerciseTitle")}>
                  <div className="flex items-center">
                    Ejercicio <SortIcon column="exerciseTitle" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("type")}>
                  <div className="flex items-center">
                    Tipo <SortIcon column="type" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("similarity")}>
                  <div className="flex items-center">
                    Similitud <SortIcon column="similarity" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("date")}>
                  <div className="flex items-center justify-end">
                    Fecha Detección <SortIcon column="date" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">
                    {alert.studentName}
                  </TableCell>
                  <TableCell>{alert.exerciseTitle}</TableCell>
                  <TableCell className="capitalize">
                    {alert.type === "ai_generated"
                      ? "IA Generativa"
                      : alert.type === "internal"
                      ? "Copia interna"
                      : "Fuente externa"}
                  </TableCell>
                  <TableCell>{getSimilarityBadge(alert.similarity)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(alert.date), "PP", { locale: dateLocale })}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground">
                    No se han detectado casos de plagio con los filtros
                    actuales.
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
