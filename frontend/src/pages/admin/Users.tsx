/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/data/pagination";

const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  // Estado del modal de creación
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as UserRole,
  });

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset a primera página al buscar
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Query principal
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["users", page, debouncedSearch, roleFilter, statusFilter],
    queryFn: () =>
      userService.list(page, 10, debouncedSearch, roleFilter, statusFilter),
    placeholderData: (previousData) => previousData,
  });

  // Mutaciones
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
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
    onError: (error: any) => {
      toast({
        title: "No se pudo eliminar",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  // Helpers de renderizado
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
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">
            Gestión de estudiantes, profesores y administradores
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
              <DialogTitle>Crear Usuario</DialogTitle>
              <DialogDescription>
                Añade un nuevo usuario al sistema. Se le enviará un correo con
                sus credenciales.
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
                    placeholder="Ej: Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos</Label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    placeholder="Ej: Pérez"
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
                  placeholder="juan@universidad.edu"
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
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
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
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as UserRole | "all");
            setPage(1);
          }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="student">Estudiantes</SelectItem>
            <SelectItem value="teacher">Profesores</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as UserStatus | "all");
            setPage(1);
          }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
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
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                Activo
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="inactive">
                                <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                                Inactivo
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="suspended">
                                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
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
                                "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer."
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
      </div>

      {data && data.totalPages > 1 && (
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
              (pageNum) => {
                const showPage =
                  pageNum === 1 ||
                  pageNum === data.totalPages ||
                  Math.abs(pageNum - page) <= 1;

                const showEllipsisBefore = pageNum === 2 && page > 3;
                const showEllipsisAfter =
                  pageNum === data.totalPages - 1 && page < data.totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                if (!showPage) return null;

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer">
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className={
                  page === data.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default UsersPage;
