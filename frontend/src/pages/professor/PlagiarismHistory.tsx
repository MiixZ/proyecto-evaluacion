import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, AlertTriangle, Calendar } from "lucide-react";
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

export default function PlagiarismHistory() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const dateLocale = i18n.language === "en" ? enUS : es;

  const { data, isLoading } = useQuery({
    queryKey: ["groupPlagiarism", groupId, page],
    queryFn: () => dashboardService.getGroupPlagiarism(groupId!, page, 20),
    enabled: !!groupId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getSimilarityBadge = (percent: number) => {
    if (percent >= 80) return <Badge variant="destructive">{percent}%</Badge>;
    if (percent >= 50)
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">{percent}%</Badge>
      );
    return <Badge variant="secondary">{percent}%</Badge>;
  };

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
          <CardTitle>Listado de Alertas</CardTitle>
          <CardDescription>
            Mostrando {data?.items.length || 0} de {data?.total || 0} casos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Ejercicio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Similitud</TableHead>
                <TableHead className="text-right">Fecha Detección</TableHead>
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
                      : alert.type}
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
                    No se han detectado casos de plagio.
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
