/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { dashboardService } from "@/services/dashboard.service";
import { degreeService } from "@/services/degree.service";
import { subjectService } from "@/services/subject.service";
import { groupService } from "@/services/group.service";
import { User, UserRole, UserStatus } from "@/types/user.type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/overlay/dropdown-menu";
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
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/forms/button";
import { Badge } from "@/components/ui/data/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { Label } from "@/components/ui/forms/label";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Trash2,
  Shield,
  UserCog,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/layout/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/data/pagination";

// --- COMPONENTE AUXILIAR PARA LA TABLA DE USUARIOS ---
const UserTable = ({
  role,
  groupId,
  filtersRequired = false,
}: {
  role: UserRole;
  groupId?: string;
  filtersRequired?: boolean;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const shouldFetch = !filtersRequired || (filtersRequired && !!groupId);

  const { data, isLoading } = useQuery({
    queryKey: ["users", role, page, limit, debouncedSearch, groupId],
    queryFn: () =>
      userService.list(page, limit, debouncedSearch, role, "all", groupId),
    enabled: shouldFetch,
    placeholderData: (prev) => prev,
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.changeStatus(id, status),
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast({ title: "Usuario eliminado" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (filtersRequired && !groupId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
        <Users className="h-10 w-10 mb-2 opacity-50" />
        <p>Selecciona una titulación y un grupo para ver a los estudiantes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${
              role === "student" ? "estudiante" : "usuario"
            }...`}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={limit.toString()}
          onValueChange={(v) => setLimit(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 filas</SelectItem>
            <SelectItem value="10">10 filas</SelectItem>
            <SelectItem value="20">20 filas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "active" ? "default" : "secondary"
                      }>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shield className="mr-2 h-4 w-4" /> Estado
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={user.status}
                              onValueChange={(v) =>
                                changeStatusMutation.mutate({
                                  id: user.id,
                                  status: v as UserStatus,
                                })
                              }>
                              <DropdownMenuRadioItem value="active">
                                Activo
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="inactive">
                                Inactivo
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("¿Eliminar usuario?"))
                              deleteMutation.mutate(user.id);
                          }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}>
          Anterior
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          Pág {page} de {data?.totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
          disabled={page >= (data?.totalPages || 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as UserRole,
  });

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const { data: years = [] } = useQuery({
    queryKey: ["academicYears"],
    queryFn: dashboardService.getAcademicYears,
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["degrees"],
    queryFn: async () => {
      const res = await degreeService.list();
      return res.items || [];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];
      const res = await subjectService.list(1, 100, {
        degreeId: selectedDegree,
      });
      return res.items;
    },
    enabled: !!selectedDegree,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", selectedSubject, selectedYear],
    queryFn: () =>
      groupService.getBySubjectAndYear(selectedSubject, selectedYear),
    enabled: !!selectedSubject && !!selectedYear,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast({ title: "Usuario creado" });
      setIsCreateOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administración centralizada de roles y accesos
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alta de Usuario</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario globalmente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos</Label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rol Inicial</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, role: v as UserRole })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudiante</SelectItem>
                    <SelectItem value="teacher">Profesor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate(newUser)}
                disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="students">Estudiantes</TabsTrigger>
          <TabsTrigger value="teachers">Profesores</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes</CardTitle>
              <CardDescription>
                Filtrar por estructura académica para encontrar grupos
                específicos.
              </CardDescription>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="w-[140px]">
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    Curso Académico
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-[200px]">
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    Titulación
                  </Label>
                  <Select
                    value={selectedDegree}
                    onValueChange={(v) => {
                      setSelectedDegree(v);
                      setSelectedSubject("");
                      setSelectedGroup("");
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona titulación" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.alias || d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-[200px]">
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    Asignatura
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={(v) => {
                      setSelectedSubject(v);
                      setSelectedGroup("");
                    }}
                    disabled={!selectedDegree}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-[200px]">
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    Grupo
                  </Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                    disabled={!selectedSubject || !selectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UserTable
                role="student"
                groupId={selectedGroup}
                filtersRequired={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cuerpo Docente</CardTitle>
              <CardDescription>
                Listado completo de profesores registrados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable role="teacher" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>
                Usuarios con privilegios totales sobre el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable role="admin" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersPage;
