/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicService } from "@/services/academic.service";
import { Degree, Subject, Course, Syllabus } from "@/types/academic.types";
import { useForm } from "react-hook-form";

// UI Components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/layout/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import {
  Plus,
  Loader2,
  BookOpen,
  GraduationCap,
  Calendar,
  Pencil,
  Filter,
  ListTree,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Badge } from "@/components/ui/data/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/forms/switch";

export default function AcademicManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("degrees");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    Degree | Subject | Course | Syllabus | null
  >(null);
  const [dialogType, setDialogType] = useState<
    "degree" | "subject" | "course" | "syllabus"
  >("degree");

  // Filtros y paginación
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");
  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("all");

  const [degreeSearch, setDegreeSearch] = useState("");
  const [degreePage, setDegreePage] = useState(1);
  const [degreeLimit, setDegreeLimit] = useState(10);

  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectLimit, setSubjectLimit] = useState(10);

  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [courseLimit, setCourseLimit] = useState(10);

  const [syllabusSearch, setSyllabusSearch] = useState("");
  const [syllabusPage, setSyllabusPage] = useState(1);
  const [syllabusLimit, setSyllabusLimit] = useState(10);

  const { data: degrees = [], isLoading: loadingDegrees } = useQuery({
    queryKey: ["degrees"],
    queryFn: academicService.getDegrees,
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => academicService.getSubjects(),
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: academicService.getCourses,
  });

  const { data: syllabi = [], isLoading: loadingSyllabi } = useQuery({
    queryKey: ["syllabi"],
    queryFn: () => academicService.getSyllabi(),
  });

  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(courses.map((c) => c.academicYear)));
    return years.sort().reverse();
  }, [courses]);

  // Funciones de filtrado y paginación
  const filterAndPaginate = <
    T extends {
      name?: string;
      code?: string;
      title?: string;
      academicYear?: string;
    }
  >(
    items: T[],
    search: string,
    page: number,
    limit: number
  ) => {
    const filtered = items.filter((item) => {
      const searchLower = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower) ||
        item.title?.toLowerCase().includes(searchLower) ||
        item.academicYear?.toLowerCase().includes(searchLower)
      );
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return { items: paginated, total, totalPages };
  };

  const filteredDegrees = filterAndPaginate(
    degrees,
    degreeSearch,
    degreePage,
    degreeLimit
  );
  const filteredSubjects = filterAndPaginate(
    subjects,
    subjectSearch,
    subjectPage,
    subjectLimit
  );

  const filteredCourses = useMemo(() => {
    let items = courses;
    if (selectedYearFilter !== "all") {
      items = items.filter((c) => c.academicYear === selectedYearFilter);
    }
    return filterAndPaginate(items, courseSearch, coursePage, courseLimit);
  }, [courses, selectedYearFilter, courseSearch, coursePage, courseLimit]);

  const filteredSyllabi = useMemo(() => {
    let items = syllabi;
    if (selectedCourseFilter !== "all") {
      items = items.filter((s) => s.courseId === selectedCourseFilter);
    }
    return filterAndPaginate(
      items,
      syllabusSearch,
      syllabusPage,
      syllabusLimit
    );
  }, [
    syllabi,
    selectedCourseFilter,
    syllabusSearch,
    syllabusPage,
    syllabusLimit,
  ]);

  // --- Mutations ---
  const saveDegreeMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? academicService.updateDegree(editingItem.id, data)
        : academicService.createDegree(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
      toast.success(
        `Titulación ${editingItem ? "actualizada" : "creada"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar titulación"),
  });

  const saveSubjectMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? academicService.updateSubject(editingItem.id, data)
        : academicService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success(
        `Asignatura ${editingItem ? "actualizada" : "creada"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar asignatura"),
  });

  const saveCourseMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? academicService.updateCourse(editingItem.id, data)
        : academicService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(
        `Curso ${editingItem ? "actualizado" : "creado"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar curso"),
  });

  const saveSyllabusMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? academicService.updateSyllabus(editingItem.id, data)
        : academicService.createSyllabus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabi"] });
      toast.success(
        `Tema ${editingItem ? "actualizado" : "creado"} correctamente`
      );
      closeDialog();
    },
    onError: () => toast.error("Error al guardar tema"),
  });

  // --- Helpers ---
  const openCreateDialog = (
    type: "degree" | "subject" | "course" | "syllabus"
  ) => {
    setDialogType(type);
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (
    item: any,
    type: "degree" | "subject" | "course" | "syllabus"
  ) => {
    setDialogType(type);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "Desconocida";
  const getDegreeName = (id: string) =>
    degrees.find((d) => d.id === id)?.name || "Desconocida";
  const getCourseLabel = (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return "Curso desconocido";
    const subject = subjects.find((s) => s.id === course.subjectId);
    return `${subject?.name} (${course.academicYear})`;
  };

  const DegreeForm = ({ defaultValues }: { defaultValues?: Degree }) => {
    const { register, handleSubmit } = useForm<Degree>({ defaultValues });
    return (
      <form
        onSubmit={handleSubmit((data) =>
          saveDegreeMutation.mutate({
            ...data,
            durationYears: Number(data.durationYears),
            totalCredits: Number(data.totalCredits),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre de la Titulación</Label>
          <Input
            {...register("name")}
            placeholder="Ej: Ingeniería Informática"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <textarea
            {...register("description")}
            placeholder="Descripción de la titulación..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Código Oficial</Label>
            <Input {...register("code")} placeholder="GII" required />
          </div>
          <div className="space-y-2">
            <Label>Años Duración</Label>
            <Input
              type="number"
              {...register("durationYears")}
              defaultValue={4}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Créditos Totales</Label>
          <Input
            type="number"
            {...register("totalCredits")}
            defaultValue={240}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            defaultValue={defaultValues?.status || "active"}
            onValueChange={(v: any) =>
              register("status").onChange({
                target: { value: v, name: "status" },
              })
            }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="archived">Archivada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={saveDegreeMutation.isPending}>
          {saveDegreeMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {defaultValues ? "Guardar Cambios" : "Crear Titulación"}
        </Button>
      </form>
    );
  };

  const SubjectForm = ({ defaultValues }: { defaultValues?: Subject }) => {
    const { register, handleSubmit, setValue } = useForm<Subject>({
      defaultValues,
    });
    return (
      <form
        onSubmit={handleSubmit((data) =>
          saveSubjectMutation.mutate({
            ...data,
            credits: Number(data.credits),
            semester: Number(data.semester),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Titulación</Label>
          <Select
            onValueChange={(val) => setValue("degreeId", val)}
            defaultValue={defaultValues?.degreeId}
            required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {degrees.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            {...register("name")}
            placeholder="Ej: Programación I"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <textarea
            {...register("description")}
            placeholder="Descripción de la asignatura..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input {...register("code")} placeholder="PR1" required />
          </div>
          <div className="space-y-2">
            <Label>Créditos ECTS</Label>
            <Input type="number" {...register("credits")} defaultValue={6} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Semestre (Plan)</Label>
          <Input type="number" {...register("semester")} placeholder="1-8" />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={saveSubjectMutation.isPending}>
          {saveSubjectMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {defaultValues ? "Guardar Cambios" : "Crear Asignatura"}
        </Button>
      </form>
    );
  };

  const CourseForm = ({ defaultValues }: { defaultValues?: Course }) => {
    const { register, handleSubmit, setValue } = useForm<Course>({
      defaultValues,
    });
    return (
      <form
        onSubmit={handleSubmit((data) =>
          saveCourseMutation.mutate({
            ...data,
            semester: Number(data.semester),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Asignatura</Label>
          <Select
            onValueChange={(val) => setValue("subjectId", val)}
            defaultValue={defaultValues?.subjectId}
            required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Año Académico</Label>
            <Input
              {...register("academicYear")}
              placeholder="2024-2025"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Semestre</Label>
            <Select
              onValueChange={(val) => setValue("semester", Number(val))}
              defaultValue={defaultValues?.semester?.toString() || "1"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1er Semestre</SelectItem>
                <SelectItem value="2">2do Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            onValueChange={(val: any) => setValue("status", val)}
            defaultValue={defaultValues?.status || "planning"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planificación</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={saveCourseMutation.isPending}>
          {saveCourseMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {defaultValues ? "Guardar Cambios" : "Crear Curso"}
        </Button>
      </form>
    );
  };

  const SyllabusForm = ({ defaultValues }: { defaultValues?: Syllabus }) => {
    const { register, handleSubmit, setValue, watch } = useForm<Syllabus>({
      defaultValues: {
        ...defaultValues,
        isPublic: defaultValues?.isPublic ?? true,
      },
    });
    const isPublic = watch("isPublic");

    return (
      <form
        onSubmit={handleSubmit((data) =>
          saveSyllabusMutation.mutate({
            ...data,
            orderIndex: Number(data.orderIndex),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Curso Académico</Label>
          <Select
            onValueChange={(val) => setValue("courseId", val)}
            defaultValue={defaultValues?.courseId}
            required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso activo" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => {
                const subj = subjects.find((s) => s.id === c.subjectId);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    {subj?.name} - {c.academicYear}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Título del Tema/Módulo</Label>
          <Input
            {...register("title")}
            placeholder="Ej: Introducción a punteros"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input
            {...register("description")}
            placeholder="Breve descripción del contenido"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Contenido</Label>
            <Select
              onValueChange={(val: any) => setValue("contentType", val)}
              defaultValue={defaultValues?.contentType || "module"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="module">Módulo</SelectItem>
                <SelectItem value="topic">Tema</SelectItem>
                <SelectItem value="lesson">Lección</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Orden</Label>
            <Input type="number" {...register("orderIndex")} defaultValue={1} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => setValue("isPublic", checked)}
          />
          <Label>Visible para estudiantes</Label>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={saveSyllabusMutation.isPending}>
          {saveSyllabusMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {defaultValues ? "Guardar Cambios" : "Crear Tema"}
        </Button>
      </form>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión Académica
          </h1>
          <p className="text-muted-foreground">
            Administra titulaciones, asignaturas, cursos y temarios.
          </p>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Crear"}
              {dialogType === "degree" && " Titulación"}
              {dialogType === "subject" && " Asignatura"}
              {dialogType === "course" && " Curso"}
              {dialogType === "syllabus" && " Tema"}
            </DialogTitle>
          </DialogHeader>
          {dialogType === "degree" && (
            <DegreeForm defaultValues={editingItem as Degree} />
          )}
          {dialogType === "subject" && (
            <SubjectForm defaultValues={editingItem as Subject} />
          )}
          {dialogType === "course" && (
            <CourseForm defaultValues={editingItem as Course} />
          )}
          {dialogType === "syllabus" && (
            <SyllabusForm defaultValues={editingItem as Syllabus} />
          )}
        </DialogContent>
      </Dialog>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="degrees" className="flex gap-2">
            <GraduationCap className="h-4 w-4" /> Titulaciones
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex gap-2">
            <BookOpen className="h-4 w-4" /> Asignaturas
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex gap-2">
            <Calendar className="h-4 w-4" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="syllabi" className="flex gap-2">
            <ListTree className="h-4 w-4" /> Temarios
          </TabsTrigger>
        </TabsList>

        {/* --- DEGREES TAB --- */}
        <TabsContent value="degrees">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openCreateDialog("degree")}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Titulación
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Titulaciones Ofertadas</CardTitle>
              <CardDescription>Grados y másteres disponibles.</CardDescription>
              <div className="flex justify-between items-center gap-4 mt-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar titulación..."
                    className="pl-8"
                    value={degreeSearch}
                    onChange={(e) => {
                      setDegreeSearch(e.target.value);
                      setDegreePage(1);
                    }}
                  />
                </div>
                <Select
                  value={degreeLimit.toString()}
                  onValueChange={(v) => setDegreeLimit(Number(v))}>
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
            </CardHeader>
            <CardContent>
              {loadingDegrees ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDegrees.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground">
                            No se encontraron titulaciones
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDegrees.items.map((degree) => (
                          <TableRow key={degree.id}>
                            <TableCell className="font-mono">
                              {degree.code}
                            </TableCell>
                            <TableCell className="font-medium">
                              {degree.name}
                            </TableCell>
                            <TableCell>{degree.durationYears} años</TableCell>
                            <TableCell>{degree.totalCredits} ECTS</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  degree.status === "active"
                                    ? "default"
                                    : "secondary"
                                }>
                                {degree.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openEditDialog(degree, "degree")
                                }>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDegreePage((p) => Math.max(1, p - 1))}
                      disabled={degreePage === 1}>
                      Anterior
                    </Button>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Pág {degreePage} de {filteredDegrees.totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDegreePage((p) =>
                          Math.min(filteredDegrees.totalPages || 1, p + 1)
                        )
                      }
                      disabled={
                        degreePage >= (filteredDegrees.totalPages || 1)
                      }>
                      Siguiente
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SUBJECTS TAB --- */}
        <TabsContent value="subjects">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openCreateDialog("subject")}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Asignatura
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Asignaturas</CardTitle>
              <CardDescription>Catálogo de asignaturas base.</CardDescription>
              <div className="flex justify-between items-center gap-4 mt-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar asignatura..."
                    className="pl-8"
                    value={subjectSearch}
                    onChange={(e) => {
                      setSubjectSearch(e.target.value);
                      setSubjectPage(1);
                    }}
                  />
                </div>
                <Select
                  value={subjectLimit.toString()}
                  onValueChange={(v) => setSubjectLimit(Number(v))}>
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
            </CardHeader>
            <CardContent>
              {loadingSubjects ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Titulación</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground">
                            No se encontraron asignaturas
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubjects.items.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-mono">
                              {subject.code}
                            </TableCell>
                            <TableCell className="font-medium">
                              {subject.name}
                            </TableCell>
                            <TableCell>
                              {getDegreeName(subject.degreeId)}
                            </TableCell>
                            <TableCell>{subject.credits} ECTS</TableCell>
                            <TableCell>{subject.semester}º</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openEditDialog(subject, "subject")
                                }>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubjectPage((p) => Math.max(1, p - 1))}
                      disabled={subjectPage === 1}>
                      Anterior
                    </Button>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Pág {subjectPage} de {filteredSubjects.totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSubjectPage((p) =>
                          Math.min(filteredSubjects.totalPages || 1, p + 1)
                        )
                      }
                      disabled={
                        subjectPage >= (filteredSubjects.totalPages || 1)
                      }>
                      Siguiente
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- COURSES TAB --- */}
        <TabsContent value="courses">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Año:</span>
              <Select
                value={selectedYearFilter}
                onValueChange={setSelectedYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => openCreateDialog("course")}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cursos Académicos</CardTitle>
              <CardDescription>
                Instancias de asignaturas impartidas por año.
              </CardDescription>
              <div className="flex justify-between items-center gap-4 mt-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar curso..."
                    className="pl-8"
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value);
                      setCoursePage(1);
                    }}
                  />
                </div>
                <Select
                  value={courseLimit.toString()}
                  onValueChange={(v) => setCourseLimit(Number(v))}>
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
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Año</TableHead>
                        <TableHead>Asignatura</TableHead>
                        <TableHead>Titulación</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground">
                            No se encontraron cursos
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCourses.items.map((course) => {
                          const subject = subjects.find(
                            (s) => s.id === course.subjectId
                          );
                          return (
                            <TableRow key={course.id}>
                              <TableCell className="font-mono">
                                {course.academicYear}
                              </TableCell>
                              <TableCell className="font-medium">
                                {subject
                                  ? `${subject.name} (${subject.code})`
                                  : "Desconocida"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {subject
                                  ? getDegreeName(subject.degreeId)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {course.semester === 1 ? "1º" : "2º"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    course.status === "active"
                                      ? "default"
                                      : "outline"
                                  }>
                                  {course.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openEditDialog(course, "course")
                                  }>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                      disabled={coursePage === 1}>
                      Anterior
                    </Button>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Pág {coursePage} de {filteredCourses.totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCoursePage((p) =>
                          Math.min(filteredCourses.totalPages || 1, p + 1)
                        )
                      }
                      disabled={
                        coursePage >= (filteredCourses.totalPages || 1)
                      }>
                      Siguiente
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SYLLABI TAB --- */}
        <TabsContent value="syllabi">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por Curso:</span>
              <Select
                value={selectedCourseFilter}
                onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getCourseLabel(c.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => openCreateDialog("syllabus")}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Tema
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Temarios y Módulos</CardTitle>
              <CardDescription>
                Estructura de contenidos para los cursos.
              </CardDescription>
              <div className="flex justify-between items-center gap-4 mt-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tema..."
                    className="pl-8"
                    value={syllabusSearch}
                    onChange={(e) => {
                      setSyllabusSearch(e.target.value);
                      setSyllabusPage(1);
                    }}
                  />
                </div>
                <Select
                  value={syllabusLimit.toString()}
                  onValueChange={(v) => setSyllabusLimit(Number(v))}>
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
            </CardHeader>
            <CardContent>
              {loadingSyllabi ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Curso</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Visibilidad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSyllabi.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground">
                            No se encontraron temas
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSyllabi.items.map((syllabus) => (
                          <TableRow key={syllabus.id}>
                            <TableCell className="text-sm font-medium text-muted-foreground">
                              {getCourseLabel(syllabus.courseId)}
                            </TableCell>
                            <TableCell>{syllabus.orderIndex}</TableCell>
                            <TableCell className="font-semibold">
                              {syllabus.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {syllabus.contentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  syllabus.isPublic ? "default" : "secondary"
                                }>
                                {syllabus.isPublic ? "Público" : "Oculto"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openEditDialog(syllabus, "syllabus")
                                }>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSyllabusPage((p) => Math.max(1, p - 1))}
                      disabled={syllabusPage === 1}>
                      Anterior
                    </Button>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Pág {syllabusPage} de {filteredSyllabi.totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSyllabusPage((p) =>
                          Math.min(filteredSyllabi.totalPages || 1, p + 1)
                        )
                      }
                      disabled={
                        syllabusPage >= (filteredSyllabi.totalPages || 1)
                      }>
                      Siguiente
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
