/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  UserPlus,
  Upload,
  Trash2,
  MoreVertical,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

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
import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Badge } from "@/components/ui/data/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/overlay/dropdown-menu";
import { Label } from "@/components/ui/forms/label";
import { toast } from "@/hooks/use-toast";

import { dashboardService } from "@/services/dashboard.service";
import { groupService } from "@/services/group.service";
import { GroupStudentDTO } from "@/types/dashboard.types";

export default function GroupsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (location.state?.selectedGroupId) {
      return location.state.selectedGroupId;
    }
    return localStorage.getItem("professorLastGroupId") || "";
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [sorting, setSorting] = useState<{
    column: keyof GroupStudentDTO | string;
    direction: "ASC" | "DESC";
  }>({ column: "name", direction: "ASC" });

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [editingStudent, setEditingStudent] = useState<GroupStudentDTO | null>(
    null
  );
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ["professorOverview"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = useMemo(
    () => dashboardData?.groups || [],
    [dashboardData?.groups]
  );

  // CAMBIO 5: Persistir cambios de selección
  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem("professorLastGroupId", selectedGroupId);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].groupId);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (location.state?.openAddStudent) {
      setIsAddOpen(true);
      window.history.replaceState(
        { ...window.history.state, openAddStudent: false },
        document.title
      );
    }
  }, [location]);

  const { data: students, isLoading } = useQuery({
    queryKey: ["groupStudents", selectedGroupId],
    queryFn: () => groupService.getGroupStudents(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const addStudentMutation = useMutation({
    mutationFn: (data: typeof newStudent) =>
      groupService.addStudent(selectedGroupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      setIsAddOpen(false);
      setNewStudent({ firstName: "", lastName: "", email: "" });
      toast({
        title: "Estudiante añadido",
        description: "Matriculado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo añadir al estudiante.",
        variant: "destructive",
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: (file: File) =>
      groupService.importStudentsCsv(selectedGroupId, file),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      setIsImportOpen(false);
      setCsvFile(null);
      toast({ title: "Importación completada", description: response.message });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Falló la importación.",
        variant: "destructive",
      });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      groupService.removeStudent(selectedGroupId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      toast({
        title: "Estudiante eliminado",
        description: "Se ha quitado del grupo.",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupService.updateStudent(selectedGroupId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      setIsEditOpen(false);
      setEditingStudent(null);
      toast({
        title: "Estudiante actualizado",
        description: "Datos guardados correctamente.",
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "No se pudo actualizar.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (studentId: string) =>
      groupService.toggleStudentStatus(selectedGroupId, studentId),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      toast({ title: "Estado actualizado", description: response.message });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado.",
        variant: "destructive",
      });
    },
  });

  const processedStudents = useMemo(() => {
    if (!students) return [];
    let result = students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    result = result.sort((a, b) => {
      const valA = a[sorting.column as keyof GroupStudentDTO];
      const valB = b[sorting.column as keyof GroupStudentDTO];
      if (typeof valA === "string" && typeof valB === "string") {
        return sorting.direction === "ASC"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sorting.direction === "ASC" ? valA - valB : valB - valA;
      }
      return 0;
    });
    return result;
  }, [students, searchTerm, sorting]);

  const handleSort = (column: string) => {
    setSorting((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "DESC" ? "ASC" : "DESC",
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sorting.column !== column)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sorting.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate(newStudent);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const [firstName, ...rest] = editingStudent.name.split(" ");
    const lastName = rest.join(" ");
    updateStudentMutation.mutate({
      id: editingStudent.id,
      data: {
        firstName: firstName,
        lastName: lastName,
        email: editingStudent.email,
      },
    });
  };

  const openEditModal = (student: GroupStudentDTO) => {
    setEditingStudent(student);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestión de Grupos
          </h1>
          <p className="text-muted-foreground">
            Administra los estudiantes y grupos de tus asignaturas
          </p>
        </div>

        <div className="w-full md:w-[300px]">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un grupo" />
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full">
                <CardTitle>Listado de Estudiantes</CardTitle>
                <CardDescription>
                  {processedStudents.length} estudiantes matriculados
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Estudiante</DialogTitle>
                      <DialogDescription>
                        Matricula a un estudiante manualmente.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          required
                          value={newStudent.firstName}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input
                          required
                          value={newStudent.lastName}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          required
                          type="email"
                          value={newStudent.email}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={addStudentMutation.isPending}>
                          {addStudentMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}{" "}
                          Añadir
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" /> Importar CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importación Masiva</DialogTitle>
                      <DialogDescription>
                        Formato: email, firstName, lastName
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                          setCsvFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          csvFile && importCsvMutation.mutate(csvFile)
                        }
                        disabled={!csvFile || importCsvMutation.isPending}>
                        Importar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort("name")}>
                      <div className="flex items-center">
                        Estudiante <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort("email")}>
                      <div className="flex items-center">
                        Email <SortIcon column="email" />
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
                      onClick={() => handleSort("progress")}>
                      <div className="flex items-center justify-end">
                        Progreso <SortIcon column="progress" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedStudents.length > 0 ? (
                    processedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatarUrl || ""} />
                            <AvatarFallback>
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          {student.status === "active" && (
                            <Badge variant="default">Activo</Badge>
                          )}
                          {student.status === "inactive" && (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                          {student.status === "risk" && (
                            <Badge variant="destructive">Riesgo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Math.round(student.progress)}%
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditModal(student)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleStatusMutation.mutate(student.id)
                                }>
                                {student.status === "inactive" ? (
                                  <>
                                    <Power className="mr-2 h-4 w-4 text-green-600" />{" "}
                                    Activar
                                  </>
                                ) : (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4 text-orange-600" />{" "}
                                    Desactivar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() =>
                                  removeStudentMutation.mutate(student.id)
                                }>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar del
                                grupo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay estudiantes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edición */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Estudiante</DialogTitle>
            </DialogHeader>
            {editingStudent && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    value={editingStudent.name}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingStudent.email}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={updateStudentMutation.isPending}>
                    {updateStudentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    Guardar
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
