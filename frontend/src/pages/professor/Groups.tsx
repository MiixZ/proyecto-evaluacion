import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  UserPlus,
  Upload,
  Trash2,
  MoreVertical,
  Download,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
} from "@/components/ui/overlay/dropdown-menu";
import { Label } from "@/components/ui/forms/label";
import { toast } from "@/hooks/use-toast";

import { dashboardService } from "@/services/dashboard.service";
import { groupService } from "@/services/group.service";

export default function GroupsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ["professorOverview"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = useMemo(() => dashboardData?.groups || [], [dashboardData]);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].groupId);
    }
  }, [groups, selectedGroupId]);

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
        description: "El estudiante ha sido matriculado correctamente.",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        description: "Falló la importación del archivo.",
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

  const filteredStudents =
    students?.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate(newStudent);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (csvFile) importCsvMutation.mutate(csvFile);
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

        {/* Selector de Grupo */}
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
                  {filteredStudents.length} estudiantes matriculados
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

                {/* Botón Añadir Individual */}
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
                        Matricula a un estudiante manualmente en este grupo.
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
                        <Label>Email Institucional</Label>
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
                          )}
                          Añadir Estudiante
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Botón Importar CSV */}
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
                        Sube un archivo CSV con las columnas:{" "}
                        <code>email, firstName, lastName</code>.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImportSubmit} className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv">Archivo CSV</Label>
                        <Input
                          id="csv"
                          type="file"
                          accept=".csv"
                          onChange={(e) =>
                            setCsvFile(e.target.files?.[0] || null)
                          }
                          required
                        />
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                        <p className="font-semibold mb-1">Formato ejemplo:</p>
                        <pre>
                          email,firstName,lastName
                          <br />
                          alumno1@uni.edu,Juan,Pérez
                          <br />
                          alumno2@uni.edu,Maria,Gómez
                        </pre>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={!csvFile || importCsvMutation.isPending}>
                          {importCsvMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Importar
                        </Button>
                      </DialogFooter>
                    </form>
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
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Progreso</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
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
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() =>
                                  removeStudentMutation.mutate(student.id)
                                }>
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
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground">
                        No se encontraron estudiantes en este grupo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
