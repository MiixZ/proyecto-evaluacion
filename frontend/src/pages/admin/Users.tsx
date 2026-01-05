/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/data/pagination";

const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  const [sorting, setSorting] = useState<{
    column: keyof User | "name";
    direction: "ASC" | "DESC";
  }>({ column: "createdAt", direction: "DESC" });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as UserRole,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => userService.list(1, 50),
  });

  const users = useMemo(() => response?.items || [], [response?.items]);

  const processedUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(lower) ||
          u.lastName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    result.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sorting.column === "name") {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else {
        valA = a[sorting.column];
        valB = b[sorting.column];
      }

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (valA < valB) return sorting.direction === "ASC" ? -1 : 1;
      if (valA > valB) return sorting.direction === "ASC" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sorting]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return processedUsers.slice(start, end);
  }, [processedUsers, page, limit]);

  const totalPages = Math.ceil(processedUsers.length / limit);

  const handleSort = (column: keyof User | "name") => {
    setSorting((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "DESC" ? "ASC" : "DESC",
    }));
  };

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast({ title: "Usuario creado correctamente" });
      setIsCreateOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
      });
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.response?.data?.message || "Inténtalo de nuevo",
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      userService.changeRole(id, role),
    onSuccess: () => {
      toast({ title: "Rol actualizado" });
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.changeStatus(id, status),
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast({ title: "Usuario eliminado" });
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
    },
    onError: (error: any) => {
      toast({
        title: "No se pudo eliminar",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sorting.column !== column)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sorting.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      admin: "bg-destructive/10 text-destructive border-destructive/20",
      teacher: "bg-primary/10 text-primary border-primary/20",
      student: "bg-secondary text-secondary-foreground border-border",
    };
    const labels = {
      admin: "Administrador",
      teacher: "Profesor",
      student: "Estudiante",
    };
    return (
      <Badge variant="outline" className={styles[role]}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles = {
      active:
        "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
      inactive:
        "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20",
      suspended:
        "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
    };
    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      suspended: "Suspendido",
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra estudiantes, profesores y permisos del sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Listado de Usuarios</CardTitle>
                <CardDescription>
                  {processedUsers.length} usuarios encontrados
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-start sm:items-center">
                {/* Selector Filas */}
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Filas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 filas</SelectItem>
                    <SelectItem value="10">10 filas</SelectItem>
                    <SelectItem value="20">20 filas</SelectItem>
                    <SelectItem value="50">50 filas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtros */}
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v as UserRole | "all");
                    setPage(1);
                  }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="student">Estudiantes</SelectItem>
                    <SelectItem value="teacher">Profesores</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as UserStatus | "all");
                    setPage(1);
                  }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Búsqueda */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Botón Crear */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Usuario</DialogTitle>
                      <DialogDescription>
                        Añade un nuevo usuario al sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={newUser.firstName}
                            onChange={(e) =>
                              setNewUser({
                                ...newUser,
                                firstName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Apellidos</Label>
                          <Input
                            value={newUser.lastName}
                            onChange={(e) =>
                              setNewUser({
                                ...newUser,
                                lastName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                          }
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
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
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => createMutation.mutate(newUser)}
                        disabled={
                          createMutation.isPending ||
                          !newUser.email ||
                          !newUser.firstName
                        }>
                        {createMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Crear
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
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("name")}>
                        <div className="flex items-center">
                          Usuario <SortIcon column="name" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("role")}>
                        <div className="flex items-center">
                          Rol <SortIcon column="role" />
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
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("lastLogin")}>
                        <div className="flex items-center">
                          Último acceso <SortIcon column="lastLogin" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground">
                          No se encontraron usuarios.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profileImageUrl} />
                                <AvatarFallback>
                                  {user.firstName[0]}
                                  {user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "Nunca"}
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
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Cambiar Rol
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={user.role}
                                      onValueChange={(v) =>
                                        changeRoleMutation.mutate({
                                          id: user.id,
                                          role: v as UserRole,
                                        })
                                      }>
                                      <DropdownMenuRadioItem value="student">
                                        Estudiante
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="teacher">
                                        Profesor
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="admin">
                                        Admin
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Cambiar Estado
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
                                      <DropdownMenuRadioItem value="suspended">
                                        Suspendido
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "¿Estás seguro de eliminar este usuario?"
                                      )
                                    ) {
                                      deleteMutation.mutate(user.id);
                                    }
                                  }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* PAGINACIÓN VISUAL SIEMPRE VISIBLE SI HAY DATOS */}
                {users.length > 0 && (
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

                        <PaginationItem>
                          <span className="px-4 text-sm text-muted-foreground">
                            Página {page} de {Math.max(1, totalPages)}
                          </span>
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className={
                              page >= totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage;
