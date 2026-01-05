/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Upload,
  Trash2,
  MoreVertical,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  History,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Button } from "@/components/ui/forms/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";
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
import {
  parseBackendError,
  extractValidationErrors,
} from "@/lib/error-handler";

import { dashboardService } from "@/services/dashboard.service";
import { groupService } from "@/services/group.service";
import { GroupStudentDTO } from "@/types/dashboard.types";
import { Input } from "@/components/ui/forms/input";

export default function GroupsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (location.state?.selectedGroupId) {
      return location.state.selectedGroupId;
    }
    return localStorage.getItem("professorLastGroupId") || "";
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      setFieldErrors({});
      toast({
        title: t("professor.groups.student_added", "Estudiante añadido"),
        description: t(
          "professor.groups.student_added_desc",
          "Matriculado correctamente."
        ),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.groups.add_error", "No se pudo añadir al estudiante.")
      );
      const validationErrors = extractValidationErrors(error);

      if (validationErrors) {
        setFieldErrors(validationErrors);
      }

      toast({
        title: t("common.error", "Error"),
        description: errorMessage,
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
      toast({
        title: t("professor.groups.import_completed", "Importación completada"),
        description: response.message,
      });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.groups.import_failed", "Falló la importación.")
      );
      toast({
        title: t("common.error", "Error"),
        description: errorMessage,
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
        title: t("professor.groups.student_removed", "Estudiante eliminado"),
        description: t(
          "professor.groups.student_removed_desc",
          "Se ha quitado del grupo."
        ),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.groups.remove_error", "No se pudo eliminar al estudiante.")
      );
      toast({
        title: t("common.error", "Error"),
        description: errorMessage,
        variant: "destructive",
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
        title: t("professor.groups.student_updated", "Estudiante actualizado"),
        description: t(
          "professor.groups.student_updated_desc",
          "Datos guardados correctamente."
        ),
      });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.groups.update_error", "No se pudo actualizar.")
      );
      toast({
        title: t("common.error", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (studentId: string) =>
      groupService.toggleStudentStatus(selectedGroupId, studentId),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: ["groupStudents", selectedGroupId],
      });
      toast({
        title: t("professor.groups.status_updated", "Estado actualizado"),
        description: response.message,
      });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.groups.status_error", "No se pudo cambiar el estado.")
      );
      toast({
        title: t("common.error", "Error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Definir columnas para DataTable
  const studentColumns: ColumnDef<GroupStudentDTO>[] = [
    {
      key: "name",
      label: t("professor.groups.student", "Estudiante"),
      sortable: true,
      render: (student) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatarUrl || ""} />
            <AvatarFallback>
              {student.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{student.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "status",
      label: t("professor.groups.status", "Estado"),
      sortable: true,
      render: (student) => {
        if (student.status === "active") {
          return (
            <Badge variant="default">
              {t("professor.groups.status_active", "Activo")}
            </Badge>
          );
        }
        if (student.status === "inactive") {
          return (
            <Badge variant="secondary">
              {t("professor.groups.status_inactive", "Inactivo")}
            </Badge>
          );
        }
        if (student.status === "risk") {
          return (
            <Badge variant="destructive">
              {t("professor.groups.status_risk", "Riesgo")}
            </Badge>
          );
        }
        return null;
      },
    },
    {
      key: "progress",
      label: t("professor.groups.progress", "Progreso"),
      sortable: true,
      render: (student) => (
        <span className="font-medium">{Math.round(student.progress)}%</span>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "actions",
      label: t("common.actions", "Acciones"),
      headerClassName: "w-[100px] text-right",
      className: "text-right",
      render: (student) => (
        <div className="flex justify-end items-center gap-1">
          {/* Botón para ver historial de actividad */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title={t(
              "professor.groups.view_submissions",
              "Ver entregas y feedback"
            )}
            onClick={() =>
              navigate(
                `/dashboard/group/${selectedGroupId}/activity?studentId=${student.id}`
              )
            }>
            <History className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    `/dashboard/group/${selectedGroupId}/activity?studentId=${student.id}`
                  )
                }>
                <History className="mr-2 h-4 w-4" />{" "}
                {t("professor.groups.view_activity", "Ver Actividad")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditModal(student)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("common.edit", "Editar")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleStatusMutation.mutate(student.id)}>
                {student.status === "inactive" ? (
                  <>
                    <Power className="mr-2 h-4 w-4 text-green-600" />{" "}
                    {t("professor.groups.activate", "Activar")}
                  </>
                ) : (
                  <>
                    <PowerOff className="mr-2 h-4 w-4 text-orange-600" />{" "}
                    {t("professor.groups.deactivate", "Desactivar")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => removeStudentMutation.mutate(student.id)}>
                <Trash2 className="mr-2 h-4 w-4" />{" "}
                {t("professor.groups.remove_from_group", "Eliminar del grupo")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

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
            {t("professor.groups.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("professor.groups.subtitle")}
          </p>
        </div>

        <div className="w-full md:w-[300px]">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue
                placeholder={t(
                  "professor.groups.select_group",
                  "Selecciona un grupo"
                )}
              />
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
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>
                  {t("professor.groups.student_list", "Listado de Estudiantes")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "professor.groups.showing_students",
                    "Mostrando {{count}} estudiantes matriculados",
                    { count: students?.length || 0 }
                  )}
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-start sm:items-center">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Dialog
                    open={isAddOpen}
                    onOpenChange={(open) => {
                      setIsAddOpen(open);
                      if (!open) {
                        setFieldErrors({});
                        setNewStudent({
                          firstName: "",
                          lastName: "",
                          email: "",
                        });
                      }
                    }}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 sm:flex-none">
                        <UserPlus className="mr-2 h-4 w-4" />{" "}
                        {t("professor.groups.add_button", "Añadir")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t(
                            "professor.groups.add_student_title",
                            "Añadir Estudiante"
                          )}
                        </DialogTitle>
                        <DialogDescription>
                          {t(
                            "professor.groups.add_student_desc",
                            "Matricula a un estudiante manualmente."
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            {t("profile_page.fields.first_name", "Nombre")}
                          </Label>
                          <Input
                            required
                            value={newStudent.firstName}
                            onChange={(e) => {
                              setNewStudent({
                                ...newStudent,
                                firstName: e.target.value,
                              });
                              if (fieldErrors.firstName) {
                                setFieldErrors({
                                  ...fieldErrors,
                                  firstName: "",
                                });
                              }
                            }}
                            className={
                              fieldErrors.firstName ? "border-red-500" : ""
                            }
                          />
                          {fieldErrors.firstName && (
                            <p className="text-sm text-red-500">
                              {fieldErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t("profile_page.fields.last_name", "Apellidos")}
                          </Label>
                          <Input
                            required
                            value={newStudent.lastName}
                            onChange={(e) => {
                              setNewStudent({
                                ...newStudent,
                                lastName: e.target.value,
                              });
                              if (fieldErrors.lastName) {
                                setFieldErrors({
                                  ...fieldErrors,
                                  lastName: "",
                                });
                              }
                            }}
                            className={
                              fieldErrors.lastName ? "border-red-500" : ""
                            }
                          />
                          {fieldErrors.lastName && (
                            <p className="text-sm text-red-500">
                              {fieldErrors.lastName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            required
                            type="email"
                            value={newStudent.email}
                            onChange={(e) => {
                              setNewStudent({
                                ...newStudent,
                                email: e.target.value,
                              });
                              if (fieldErrors.email) {
                                setFieldErrors({ ...fieldErrors, email: "" });
                              }
                            }}
                            className={
                              fieldErrors.email ? "border-red-500" : ""
                            }
                          />
                          {fieldErrors.email && (
                            <p className="text-sm text-red-500">
                              {fieldErrors.email}
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={addStudentMutation.isPending}>
                            {addStudentMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}{" "}
                            {t("professor.groups.add_button", "Añadir")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 sm:flex-none">
                        <Upload className="mr-2 h-4 w-4" /> CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t(
                            "professor.groups.bulk_import",
                            "Importación Masiva"
                          )}
                        </DialogTitle>
                        <DialogDescription>
                          {t(
                            "professor.groups.csv_format",
                            "Formato: email, firstName, lastName"
                          )}
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
                          {t("professor.groups.import_button", "Importar")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={(students || []) as unknown as Record<string, unknown>[]}
              columns={
                studentColumns as unknown as ColumnDef<
                  Record<string, unknown>
                >[]
              }
              searchKeys={["name", "email"]}
              searchPlaceholder={t(
                "professor.groups.search_placeholder",
                "Buscar por nombre o email..."
              )}
              filterOptions={[
                {
                  key: "status",
                  label: t(
                    "professor.groups.filter_status",
                    "Filtrar por estado"
                  ),
                  options: [
                    {
                      value: "active",
                      label: t("professor.groups.status_active", "Activo"),
                    },
                    {
                      value: "inactive",
                      label: t("professor.groups.status_inactive", "Inactivo"),
                    },
                    {
                      value: "risk",
                      label: t("professor.groups.status_risk", "Riesgo"),
                    },
                  ],
                },
              ]}
              pageSize={10}
              emptyMessage={t(
                "professor.groups.no_students_match",
                "No hay estudiantes que coincidan con la búsqueda."
              )}
              getRowKey={(student) => (student as any).id}
              isLoading={isLoading}
              loadingRows={5}
            />
          </CardContent>
        </Card>

        {/* Modal de Edición (sin cambios) */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("professor.groups.edit_student", "Editar Estudiante")}
              </DialogTitle>
            </DialogHeader>
            {editingStudent && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {t("professor.groups.full_name", "Nombre Completo")}
                  </Label>
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
                    {t("common.save", "Guardar")}
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
