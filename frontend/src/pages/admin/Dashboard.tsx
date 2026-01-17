/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { dashboardService } from "@/services/dashboard.service";
import { adminDashboardService } from "@/services/dashboard.admin.service";
import { degreeService } from "@/services/degree.service";
import { subjectService } from "@/services/subject.service";
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
  Users,
  GraduationCap,
  BookOpen,
  FileCode,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Building,
  Loader2,
  Calendar,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/layout/accordion";
import { StatCard } from "@/components/ui/data/stat-card";
import { Input } from "@/components/ui/forms/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import { Label } from "@/components/ui/forms/label";
import { Badge } from "@/components/ui/data/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Link } from "react-router-dom";
import { SubmissionsByDayChart } from "@/components/admin/charts/SubmissionsByDayChart";
import { LanguageDistributionChart } from "@/components/admin/charts/LanguageDistributionChart";
import { AcceptanceRateChart } from "@/components/admin/charts/AcceptanceRateChart";
import { UsersByRoleChart } from "@/components/admin/charts/UsersByRoleChart";

const AdminDashboard = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedYear, setSelectedYear] = useState<string>("");

  const [createDegreeOpen, setCreateDegreeOpen] = useState(false);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null
  );
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [createdUserEmail, setCreatedUserEmail] = useState("");

  const [newDegreeName, setNewDegreeName] = useState("");
  const [newDegreeCode, setNewDegreeCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectSemester, setNewSubjectSemester] = useState("1");
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "teacher" as const,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academicYears"],
    queryFn: dashboardService.getAcademicYears,
  });

  useEffect(() => {
    if (!selectedYear && academicYears.length > 0) {
      setSelectedYear(academicYears[0]);
    }
  }, [academicYears, selectedYear]);

  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboard", debouncedSearch, selectedYear],
    queryFn: () =>
      dashboardService.getAdminStats(selectedYear, debouncedSearch),
    enabled: !!selectedYear || academicYears.length === 0,
  });

  const { data: chartsData, isLoading: isLoadingCharts } = useQuery({
    queryKey: ["adminDashboardCharts"],
    queryFn: adminDashboardService.getChartsData,
  });

  const createDegreeMutation = useMutation({
    mutationFn: degreeService.create,
    onSuccess: () => {
      toast({ title: t("admin.dashboard.degree_created") });
      setCreateDegreeOpen(false);
      setNewDegreeName("");
      setNewDegreeCode("");
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: () => {
      toast({
        title: t("admin.dashboard.degree_error"),
        variant: "destructive",
      });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: () => {
      toast({ title: t("admin.dashboard.subject_added") });
      setCreateSubjectOpen(false);
      setNewSubjectName("");
      setNewSubjectCode("");
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: () => {
      toast({
        title: t("admin.dashboard.subject_error"),
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const userService = await import("@/services/user.service");
      return userService.userService.create(userData);
    },
    onSuccess: (data: any) => {
      toast({ title: t("admin.dashboard.professor_created") });
      setCreateUserOpen(false);

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
        role: "teacher",
      });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err: any) => {
      toast({
        title: t("admin.dashboard.professor_error"),
        description: err.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateDegree = () => {
    if (!newDegreeName) return;
    createDegreeMutation.mutate({
      name: newDegreeName,
      code: newDegreeCode,
      status: "active",
    });
  };

  const handleCreateSubject = () => {
    if (!newSubjectName || !selectedDegreeId) return;
    createSubjectMutation.mutate({
      name: newSubjectName,
      code: newSubjectCode,
      degreeId: selectedDegreeId,
      semester: parseInt(newSubjectSemester),
      type: "compulsory",
    });
  };

  const handleCreateUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) return;
    createUserMutation.mutate(newUser);
  };

  const openAddSubjectModal = (degreeId: string) => {
    setSelectedDegreeId(degreeId);
    setCreateSubjectOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const degrees = data?.academicStructure || [];
  const teachers = data?.teachers || [];
  const stats = data?.globalStats;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {t("admin.dashboard.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.dashboard.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* SELECTOR DE AÑO ACADÉMICO */}
          <div className="w-[180px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("admin.dashboard.select_year")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {t("admin.dashboard.academic_year")} {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-[1px] bg-border hidden md:block" />

          <Dialog open={createDegreeOpen} onOpenChange={setCreateDegreeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <GraduationCap className="h-4 w-4 mr-2" />
                {t("admin.dashboard.new_degree")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("admin.dashboard.create_degree_title")}
                </DialogTitle>
                <DialogDescription>
                  {t("admin.dashboard.create_degree_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="degree-name">
                    {t("admin.dashboard.degree_name")}
                  </Label>
                  <Input
                    id="degree-name"
                    placeholder={t("admin.dashboard.degree_name_placeholder")}
                    value={newDegreeName}
                    onChange={(e) => setNewDegreeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">
                    {t("admin.dashboard.degree_code")}
                  </Label>
                  <Input
                    id="code"
                    placeholder={t("admin.dashboard.degree_code_placeholder")}
                    value={newDegreeCode}
                    onChange={(e) => setNewDegreeCode(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDegreeOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleCreateDegree}
                  disabled={createDegreeMutation.isPending}>
                  {createDegreeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("admin.dashboard.create_degree_button")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal para añadir asignatura (global o desde botón específico) */}
          <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("admin.dashboard.add_subject_title")}
                </DialogTitle>
                <DialogDescription>
                  {t("admin.dashboard.add_subject_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("admin.dashboard.degree_id")}</Label>
                  <Input value={selectedDegreeId || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject-name">
                    {t("admin.dashboard.subject_name")}
                  </Label>
                  <Input
                    id="subject-name"
                    placeholder={t("admin.dashboard.subject_name_placeholder")}
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject-code">
                    {t("admin.dashboard.subject_code")}
                  </Label>
                  <Input
                    id="subject-code"
                    placeholder={t("admin.dashboard.subject_code_placeholder")}
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">
                    {t("admin.dashboard.semester")}
                  </Label>
                  <Select
                    value={newSubjectSemester}
                    onValueChange={setNewSubjectSemester}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.dashboard.select_semester")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                          {t("admin.dashboard.semester_ordinal")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateSubjectOpen(false)}>
                  {t("admin.dashboard.cancel")}
                </Button>
                <Button
                  onClick={handleCreateSubject}
                  disabled={createSubjectMutation.isPending}>
                  {createSubjectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("admin.dashboard.add_subject_button")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("admin.dashboard.active_degrees")}
          value={kpis?.activeDegrees || 0}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title={t("admin.dashboard.active_subjects")}
          value={kpis?.activeSubjects || 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title={t("admin.dashboard.active_teachers")}
          value={kpis?.activeTeachers || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title={t("admin.dashboard.total_exercises")}
          value={kpis?.totalExercises || 0}
          icon={<FileCode className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Academic Structure */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Estructura Académica
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.dashboard.search_degree")}
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {degrees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron titulaciones
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {degrees.map((degree) => (
                    <AccordionItem key={degree.id} value={degree.id}>
                      <AccordionTrigger className="hover:no-underline px-2 hover:bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{degree.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {degree.subjects.length} asignaturas
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 px-2">
                        <div className="space-y-2 pl-4 md:pl-[52px]">
                          {degree.subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {subject.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.stats.groups} grupos •{" "}
                                    {subject.stats.students} estudiantes •{" "}
                                    {subject.stats.exercises} ejercicios
                                  </p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-auto m-auto flex items-center mt-2 border-dashed border hover:border-solid"
                            onClick={() => openAddSubjectModal(degree.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Añadir asignatura a {degree.name}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Professors List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {t("admin.dashboard.professors")}
                </CardTitle>
                <Link to="/dashboard/users?role=teacher">
                  <Button variant="ghost" size="sm">
                    {t("admin.dashboard.view_all")}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {teachers.map((prof) => (
                <div
                  key={prof.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                      {prof.first_name[0]}
                      {prof.last_name[0]}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">
                        {prof.first_name} {prof.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t("admin.dashboard.subjects_teachers", {
                          subjects: prof.subject_count,
                          groups: prof.group_count,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button className="w-auto flex m-auto mt-2" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("admin.dashboard.add_professor")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t("admin.dashboard.create_professor_title")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("admin.dashboard.create_professor_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          {t("admin.dashboard.first_name")}
                        </Label>
                        <Input
                          id="firstName"
                          placeholder={t(
                            "admin.dashboard.first_name_placeholder"
                          )}
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
                        <Label htmlFor="lastName">
                          {t("admin.dashboard.last_name")}
                        </Label>
                        <Input
                          id="lastName"
                          placeholder={t(
                            "admin.dashboard.last_name_placeholder"
                          )}
                          value={newUser.lastName}
                          onChange={(e) =>
                            setNewUser({ ...newUser, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t("admin.dashboard.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("admin.dashboard.email_placeholder")}
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">{t("admin.dashboard.role")}</Label>
                      <Input
                        id="role"
                        value={t("admin.dashboard.role_professor")}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateUserOpen(false)}>
                      {t("admin.dashboard.cancel")}
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("admin.dashboard.create_professor_button")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Global Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("admin.dashboard.global_stats")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("admin.dashboard.active_students")}
                </span>
                <span className="font-medium">
                  {stats?.activeStudents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("admin.dashboard.submissions_today")}
                </span>
                <span className="font-medium">
                  {stats?.submissionsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("admin.dashboard.success_rate_global")}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary">
                  {Number(stats?.successRate || 0).toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-5 space-y-6 mt-8">
        <h2 className="text-xl font-semibold">
          {t("admin.dashboard.analytics")}
        </h2>

        {isLoadingCharts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubmissionsByDayChart data={chartsData.submissionsByDay} />
            <LanguageDistributionChart data={chartsData.languageDistribution} />
            <AcceptanceRateChart data={chartsData.acceptanceRateByDifficulty} />
            <UsersByRoleChart data={chartsData.usersByRole} />
          </div>
        ) : null}
      </div>

      {/* Diálogo de Contraseña Temporal */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t(
                "admin.users.temporary_password_title",
                "Profesor creado exitosamente"
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "admin.users.temporary_password_desc",
                "Guarda esta contraseña temporal, no se volverá a mostrar"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("admin.dashboard.email", "Email")}
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
                          "Contraseña copiada"
                        ),
                        description: t(
                          "admin.users.password_copied_desc",
                          "Compártela de forma segura con el usuario"
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
                      "El usuario deberá cambiar esta contraseña en su primer inicio de sesión. Esta contraseña no se volverá a mostrar."
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
    </>
  );
};

export default AdminDashboard;
