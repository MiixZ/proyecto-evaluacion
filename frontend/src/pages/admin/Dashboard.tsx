import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
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
  ChevronRight,
  Building,
  Loader2,
  Calendar,
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

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedYear, setSelectedYear] = useState<string>("");

  const [createDegreeOpen, setCreateDegreeOpen] = useState(false);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [selectedDegreeId, setSelectedDegreeId] = useState<string | null>(null);

  const [newDegreeName, setNewDegreeName] = useState("");
  const [newDegreeCode, setNewDegreeCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectSemester, setNewSubjectSemester] = useState("1");

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

  const createDegreeMutation = useMutation({
    mutationFn: degreeService.create,
    onSuccess: () => {
      toast({ title: "Titulación creada correctamente" });
      setCreateDegreeOpen(false);
      setNewDegreeName("");
      setNewDegreeCode("");
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: () => {
      toast({
        title: "Error al crear titulación",
        variant: "destructive",
      });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: () => {
      toast({ title: "Asignatura añadida correctamente" });
      setCreateSubjectOpen(false);
      setNewSubjectName("");
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: () => {
      toast({
        title: "Error al añadir asignatura",
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
      degreeId: selectedDegreeId,
      semester: parseInt(newSubjectSemester),
      type: "compulsory", // Default
    });
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
          <h1 className="text-2xl font-bold mb-1">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Visión global del sistema académico
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* SELECTOR DE AÑO ACADÉMICO */}
          <div className="w-[180px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Curso académico" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    Curso {year}
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
                Nueva titulación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Titulación</DialogTitle>
                <DialogDescription>
                  Añade una nueva titulación al sistema educativo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="degree-name">Nombre de la titulación</Label>
                  <Input
                    id="degree-name"
                    placeholder="Ej: Grado en Ingeniería Informática"
                    value={newDegreeName}
                    onChange={(e) => setNewDegreeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código / Alias</Label>
                  <Input
                    id="code"
                    placeholder="Ej: GII"
                    value={newDegreeCode}
                    onChange={(e) => setNewDegreeCode(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDegreeOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateDegree}
                  disabled={createDegreeMutation.isPending}>
                  {createDegreeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear titulación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal para añadir asignatura (global o desde botón específico) */}
          <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Asignatura</DialogTitle>
                <DialogDescription>
                  Asocia una nueva asignatura a la titulación seleccionada.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titulación ID</Label>
                  <Input value={selectedDegreeId || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject-name">Nombre de la Asignatura</Label>
                  <Input
                    id="subject-name"
                    placeholder="Ej: Estructuras de Datos"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semestre</Label>
                  <Select
                    value={newSubjectSemester}
                    onValueChange={setNewSubjectSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}º Semestre
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
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateSubject}
                  disabled={createSubjectMutation.isPending}>
                  {createSubjectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Añadir asignatura
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Titulaciones Activas"
          value={kpis?.activeDegrees || 0}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Asignaturas Activas"
          value={kpis?.activeSubjects || 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Profesores Activos"
          value={kpis?.activeTeachers || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Ejercicios Totales"
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
                    placeholder="Buscar titulación..."
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
                <CardTitle className="text-base">Profesores</CardTitle>
                <Link to="/dashboard/users?role=teacher">
                  <Button variant="ghost" size="sm">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
                        {prof.subject_count} asignaturas • {prof.group_count}{" "}
                        grupos
                      </p>
                    </div>
                  </div>
                  <Link to={`/dashboard/users/${prof.user_id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              <Link to="/dashboard/users/create">
                <Button className="w-full mt-2" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir profesor
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Global Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estadísticas Globales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estudiantes activos
                </span>
                <span className="font-medium">
                  {stats?.activeStudents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Envíos hoy
                </span>
                <span className="font-medium">
                  {stats?.submissionsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tasa de éxito global
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
    </>
  );
};

export default AdminDashboard;
