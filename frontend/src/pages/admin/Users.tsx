/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { userService } from "@/services/user.service";
import { dashboardService } from "@/services/dashboard.service";
import { degreeService } from "@/services/degree.service";
import { subjectService } from "@/services/subject.service";
import { groupService } from "@/services/group.service";
import { UserRole, UserStatus } from "@/types/user.type";
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
  parseBackendError,
  extractValidationErrors,
  applyValidationErrors,
} from "@/lib/error-handler";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Trash2,
  Shield,
  UserCog,
  Users,
  GraduationCap,
  AlertCircle,
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

// --- COMPONENTE DE ASIGNACIÓN DE GRUPO ---
const AssignGroupDialog = ({
  userId,
  isOpen,
  onClose,
  userName,
}: {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const { data: years = [] } = useQuery({
    queryKey: ["academicYears"],
    queryFn: dashboardService.getAcademicYears,
    enabled: isOpen,
  });

  const { data: degrees = [] } = useQuery({
    queryKey: ["degrees"],
    queryFn: async () => (await degreeService.list()).items || [],
    enabled: isOpen,
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
    enabled: !!selectedDegree && isOpen,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", selectedSubject, selectedYear],
    queryFn: () =>
      groupService.getBySubjectAndYear(selectedSubject, selectedYear),
    enabled: !!selectedSubject && !!selectedYear && isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: () => userService.assignGroup(userId, selectedGroup, "teacher"),
    onSuccess: () => {
      toast({ title: t("admin.users.assigned_success") });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      setSelectedYear("");
      setSelectedDegree("");
      setSelectedSubject("");
      setSelectedGroup("");
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("admin.users.assign_error"),
      );
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.users.assign_group_title")}</DialogTitle>
          <DialogDescription>
            {t("admin.users.assign_group_desc", { userName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("admin.users.academic_year")}</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.users.select_year")} />
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
          <div className="space-y-2">
            <Label>{t("admin.users.degree")}</Label>
            <Select
              value={selectedDegree}
              onValueChange={(v) => {
                setSelectedDegree(v);
                setSelectedSubject("");
                setSelectedGroup("");
              }}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.users.select_degree")} />
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
          <div className="space-y-2">
            <Label>{t("admin.users.subject")}</Label>
            <Select
              value={selectedSubject}
              onValueChange={(v) => {
                setSelectedSubject(v);
                setSelectedGroup("");
              }}
              disabled={!selectedDegree}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.users.select_subject")} />
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
          <div className="space-y-2">
            <Label>{t("admin.users.group")}</Label>
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              disabled={!selectedSubject || !selectedYear}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.users.select_group")} />
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedGroup || assignMutation.isPending}>
            {assignMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("admin.users.assign_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UserTable = ({
  role,
  groupId,
  filtersRequired = false,
  onPasswordReset,
}: {
  role: UserRole;
  groupId?: string;
  filtersRequired?: boolean;
  onPasswordReset: (email: string, tempPass: string) => void;
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assignDialogUser, setAssignDialogUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
      toast({ title: t("admin.users.status_updated") });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("admin.users.status_error"),
      );
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      userService.changeRole(id, role),
    onSuccess: () => {
      toast({ title: t("admin.users.role_updated") });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("admin.users.role_error"),
      );
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast({ title: t("admin.users.user_deleted") });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("admin.users.delete_error"),
      );
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  if (filtersRequired && !groupId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
        <Users className="h-10 w-10 mb-2 opacity-50" />
        <p>{t("admin.users.select_filters")}</p>
      </div>
    );
  }

  return (
    <>
      {assignDialogUser && (
        <AssignGroupDialog
          userId={assignDialogUser.id}
          userName={assignDialogUser.name}
          isOpen={!!assignDialogUser}
          onClose={() => setAssignDialogUser(null)}
        />
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.users.search_placeholder")}
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
              <SelectItem value="5">5 {t("common.rows")}</SelectItem>
              <SelectItem value="10">10 {t("common.rows")}</SelectItem>
              <SelectItem value="20">20 {t("common.rows")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.users.table.user")}</TableHead>
                <TableHead>{t("admin.users.table.email")}</TableHead>
                <TableHead>{t("admin.users.table.role")}</TableHead>
                <TableHead>{t("admin.users.table.assigned_groups")}</TableHead>
                <TableHead>{t("admin.users.table.status")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground">
                    {t("common.no_results")}
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
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.enrollments && user.enrollments.length > 0 ? (
                        <Select>
                          <SelectTrigger className="w-[200px] h-8 text-xs">
                            <SelectValue
                              placeholder={`${user.enrollments.length} grupo${
                                user.enrollments.length > 1 ? "s" : ""
                              }`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {user.enrollments.map((e, idx) => (
                              <SelectItem
                                key={`${e.subjectName}-${e.groupName}-${idx}`}
                                value={`val-${idx}`}
                                disabled
                                className="text-xs opacity-100 text-foreground cursor-default">
                                <span className="font-semibold">
                                  {e.subjectName}
                                </span>
                                <span className="mx-1">•</span>
                                {e.groupName} ({e.academicYear})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          {t("admin.users.no_groups")}
                        </span>
                      )}
                    </TableCell>
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
                          <DropdownMenuLabel>
                            {t("common.actions")}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="mr-2 h-4 w-4" />{" "}
                              {t("admin.users.table.status")}
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
                                  {t("admin.users.status_active")}
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="inactive">
                                  {t("admin.users.status_inactive")}
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <UserCog className="mr-2 h-4 w-4" />{" "}
                              {t("admin.users.table.role")}
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
                                  {t("admin.users.role_student")}
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="teacher">
                                  {t("admin.users.role_professor")}
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="admin">
                                  {t("admin.users.role_admin")}
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          {user.role === "teacher" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setAssignDialogUser({
                                  id: user.id,
                                  name: `${user.firstName} ${user.lastName}`,
                                })
                              }>
                              <GraduationCap className="mr-2 h-4 w-4" />{" "}
                              {t("admin.users.assign_to_group")}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => {
                              if (
                                confirm(
                                  t(
                                    "admin.users.reset_password_confirm",
                                    "Are you sure? This will generate a new temporary password.",
                                  ),
                                )
                              ) {
                                userService
                                  .adminResetPassword(user.id)
                                  .then((data) => {
                                    onPasswordReset(
                                      user.email,
                                      data.temporaryPassword,
                                    );
                                    toast({
                                      title: t(
                                        "admin.users.password_reset_success",
                                        "Password reset successfully",
                                      ),
                                    });
                                  })
                                  .catch((error) => {
                                    toast({
                                      title: t("common.error"),
                                      description:
                                        error.message ||
                                        t(
                                          "admin.users.reset_error",
                                          "Error resetting password",
                                        ),
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}>
                            <AlertCircle className="mr-2 h-4 w-4" />{" "}
                            {t("admin.users.reset_password", "Reset Password")}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(t("admin.users.delete_confirm")))
                                deleteMutation.mutate(user.id);
                            }}>
                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                            {t("common.delete")}
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
            {t("common.previous")}
          </Button>
          <div className="flex items-center text-sm text-muted-foreground">
            {t("common.page")} {page} {t("common.of")} {data?.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(data?.totalPages || 1, p + 1))
            }
            disabled={page >= (data?.totalPages || 1)}>
            {t("common.next")}
          </Button>
        </div>
      </div>
    </>
  );
};

// --- PÁGINA PRINCIPAL ---
const UsersPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [createdUserEmail, setCreatedUserEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  // Auto-select most recent year
  useEffect(() => {
    if (!selectedYear && years.length > 0) {
      // Sort descending to get the most recent year
      const sortedYears = [...years].sort().reverse();
      setSelectedYear(sortedYears[0]);
    }
  }, [years, selectedYear]);

  // Auto-select first degree
  useEffect(() => {
    if (!selectedDegree && degrees.length > 0) {
      setSelectedDegree(degrees[0].id);
    }
  }, [degrees, selectedDegree]);

  // Auto-select first subject
  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Auto-select first group
  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0].id);
    }
  }, [groups, selectedGroup]);

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: (data) => {
      toast({ title: t("admin.users.user_created") });
      setIsCreateOpen(false);

      // Guardar la contraseña temporal y mostrar diálogo
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        setCreatedUserEmail(newUser.email);
        setShowPasswordDialog(true);
      }

      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
      });
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("admin.users.create_error"),
      );
      const validationErrors = extractValidationErrors(error);

      if (validationErrors) {
        setFieldErrors(validationErrors);
      }

      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("admin.users.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.users.subtitle")}</p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setFieldErrors({});
              setNewUser({
                firstName: "",
                lastName: "",
                email: "",
                role: "student",
              });
            }
          }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t("admin.users.create_button")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.users.create_user_title")}</DialogTitle>
              <DialogDescription>
                {t("admin.users.create_user_desc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("profile_page.fields.first_name")}</Label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => {
                      setNewUser({ ...newUser, firstName: e.target.value });
                      if (fieldErrors.firstName) {
                        setFieldErrors({ ...fieldErrors, firstName: "" });
                      }
                    }}
                    className={fieldErrors.firstName ? "border-red-500" : ""}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("profile_page.fields.last_name")}</Label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => {
                      setNewUser({ ...newUser, lastName: e.target.value });
                      if (fieldErrors.lastName) {
                        setFieldErrors({ ...fieldErrors, lastName: "" });
                      }
                    }}
                    className={fieldErrors.lastName ? "border-red-500" : ""}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.users.email")}</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: "" });
                    }
                  }}
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("admin.users.initial_role")}</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, role: v as UserRole })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      {t("admin.users.role_student")}
                    </SelectItem>
                    <SelectItem value="teacher">
                      {t("admin.users.role_professor")}
                    </SelectItem>
                    <SelectItem value="admin">
                      {t("admin.users.role_admin")}
                    </SelectItem>
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
                {t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="students">
            {t("admin.users.tab_students")}
          </TabsTrigger>
          <TabsTrigger value="teachers">
            {t("admin.users.tab_professors")}
          </TabsTrigger>
          <TabsTrigger value="admins">
            {t("admin.users.tab_admins")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.users.students_title")}</CardTitle>
              <CardDescription>
                {t("admin.users.students_desc")}
              </CardDescription>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="w-[140px]">
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    {t("admin.users.academic_year")}
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.users.select_year")} />
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
                    {t("admin.users.degree")}
                  </Label>
                  <Select
                    value={selectedDegree}
                    onValueChange={(v) => {
                      setSelectedDegree(v);
                      setSelectedSubject("");
                      setSelectedGroup("");
                    }}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.users.select_degree")}
                      />
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
                    {t("admin.users.subject")}
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={(v) => {
                      setSelectedSubject(v);
                      setSelectedGroup("");
                    }}
                    disabled={!selectedDegree}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.users.select_subject")}
                      />
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
                    {t("admin.users.group")}
                  </Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                    disabled={!selectedSubject || !selectedYear}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.users.select_group")}
                      />
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
                onPasswordReset={(email, pass) => {
                  setCreatedUserEmail(email);
                  setTemporaryPassword(pass);
                  setShowPasswordDialog(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.users.professors_title")}</CardTitle>
              <CardDescription>
                {t("admin.users.professors_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                role="teacher"
                onPasswordReset={(email, pass) => {
                  setCreatedUserEmail(email);
                  setTemporaryPassword(pass);
                  setShowPasswordDialog(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.users.admins_title")}</CardTitle>
              <CardDescription>{t("admin.users.admins_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                role="admin"
                onPasswordReset={(email, pass) => {
                  setCreatedUserEmail(email);
                  setTemporaryPassword(pass);
                  setShowPasswordDialog(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Contraseña Temporal */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t(
                "admin.users.temporary_password_title",
                "Usuario creado exitosamente",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "admin.users.temporary_password_desc",
                "Guarda esta contraseña temporal, no se volverá a mostrar",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("admin.users.email", "Email")}
              </Label>
              <div className="flex items-center gap-2">
                <Input value={createdUserEmail} readOnly className="bg-muted" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdUserEmail);
                    toast({ title: t("common.copied", "Copiado") });
                  }}>
                  {t("common.copy", "Copiar")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("admin.users.temporary_password", "Contraseña temporal")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={temporaryPassword || ""}
                  readOnly
                  className="font-mono bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700"
                  type="text"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (temporaryPassword) {
                      navigator.clipboard.writeText(temporaryPassword);
                      toast({
                        title: t(
                          "admin.users.password_copied",
                          "Contraseña copiada",
                        ),
                        description: t(
                          "admin.users.password_copied_desc",
                          "Compártela de forma segura con el usuario",
                        ),
                      });
                    }
                  }}>
                  {t("common.copy", "Copiar")}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    {t("admin.users.important", "Importante")}
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {t(
                      "admin.users.password_warning",
                      "El usuario deberá cambiar esta contraseña en su primer inicio de sesión. Esta contraseña no se volverá a mostrar.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowPasswordDialog(false);
                setTemporaryPassword(null);
                setCreatedUserEmail("");
              }}>
              {t("common.understood", "Entendido")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
