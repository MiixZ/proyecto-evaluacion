/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Loader2,
  FileCode,
  Filter,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader } from "@/components/ui/layout/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Badge } from "@/components/ui/data/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/overlay/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { toast } from "@/hooks/use-toast";
import { exerciseService } from "@/services/exercise.service";

export default function ExercisesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: exerciseService.getMyExercises,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      exerciseService.togglePublish(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({
        title: "Estado actualizado",
        description: "La visibilidad del ejercicio ha cambiado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => exerciseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({ title: "Ejercicio eliminado" });
    },
    onError: (err: any) => {
      toast({
        title: "No se pudo eliminar",
        description: err.response?.data?.message || "Error desconocido",
        variant: "destructive",
      });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => exerciseService.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercises"] });
      toast({
        title: "Ejercicio duplicado",
        description: "Se ha creado una copia en estado borrador.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Falló la clonación del ejercicio.",
        variant: "destructive",
      });
    },
  });

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? ex.isPublished
          : !ex.isPublished;
      return matchesSearch && matchesStatus;
    });
  }, [exercises, searchTerm, statusFilter]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "beginner":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "advanced":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            Mis Ejercicios
          </h1>
          <p className="text-muted-foreground">
            Gestiona, edita y publica los problemas de programación para tus
            asignaturas.
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/create")}>
          <Plus className="mr-2 h-4 w-4" /> Crear Nuevo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o asignatura..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Asignatura / Tema</TableHead>
                  <TableHead>Dificultad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Entregas</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell className="font-medium">
                        {ex.title}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Creado el{" "}
                          {format(new Date(ex.createdAt), "d MMM yyyy", {
                            locale: es,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{ex.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {ex.syllabus}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(ex.difficulty)}>
                          {ex.difficulty === "beginner"
                            ? "Fácil"
                            : ex.difficulty === "intermediate"
                            ? "Medio"
                            : "Difícil"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ex.isPublished ? (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ex.submissionCount}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* TODO: Implementar Edit Page */}
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/dashboard/edit/${ex.id}`)
                              }>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => cloneMutation.mutate(ex.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() =>
                                togglePublishMutation.mutate({
                                  id: ex.id,
                                  status: !ex.isPublished,
                                })
                              }>
                              {ex.isPublished ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4 text-orange-500" />{" "}
                                  Despublicar
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4 text-green-600" />{" "}
                                  Publicar
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (
                                  confirm(
                                    "¿Estás seguro? Esta acción no se puede deshacer."
                                  )
                                ) {
                                  deleteMutation.mutate(ex.id);
                                }
                              }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground">
                      No se encontraron ejercicios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
