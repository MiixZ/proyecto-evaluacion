/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicService } from "@/services/academic.service";
import { Degree, Subject, Course } from "@/types/academic.types";
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

export default function AcademicManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("degrees");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    Degree | Subject | Course | null
  >(null);
  const [dialogType, setDialogType] = useState<"degree" | "subject" | "course">(
    "degree"
  );

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  // --- Queries ---
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

  // --- Derived State (Filtros) ---
  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(courses.map((c) => c.academicYear)));
    return years.sort().reverse();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedYearFilter === "all") return courses;
    return courses.filter((c) => c.academicYear === selectedYearFilter);
  }, [courses, selectedYearFilter]);

  // --- Mutations (Create & Update) ---
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

  // --- Helpers ---
  const openCreateDialog = (type: "degree" | "subject" | "course") => {
    setDialogType(type);
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any, type: "degree" | "subject" | "course") => {
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

  // --- Forms ---

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
          <select
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="active">Activa</option>
            <option value="archived">Archivada</option>
          </select>
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
    const { register, handleSubmit, setValue, watch } = useForm<Subject>({
      defaultValues,
    });
    // Watch degreeId si necesitamos filtrar algo dinámicamente, por ahora select simple
    const currentDegreeId = watch("degreeId");

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
          <Label>Titulación a la que pertenece</Label>
          <Select
            onValueChange={(val) => setValue("degreeId", val)}
            defaultValue={defaultValues?.degreeId}
            required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una titulación" />
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
          <Label>Nombre de la Asignatura</Label>
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
          <Label>Semestre (Global en plan de estudios)</Label>
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
              <SelectValue placeholder="Selecciona una asignatura" />
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
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1er Semestre</SelectItem>
                <SelectItem value="2">2do Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Estado del Curso</Label>
          <Select
            onValueChange={(val: any) => setValue("status", val)}
            defaultValue={defaultValues?.status || "planning"}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión Académica
          </h1>
          <p className="text-muted-foreground">
            Administra titulaciones, asignaturas y cursos académicos.
          </p>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Crear"}{" "}
              {dialogType === "degree"
                ? "Titulación"
                : dialogType === "subject"
                ? "Asignatura"
                : "Curso"}
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
            </CardHeader>
            <CardContent>
              {loadingDegrees ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
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
                    {degrees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No hay titulaciones
                        </TableCell>
                      </TableRow>
                    )}
                    {degrees.map((degree) => (
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
                            onClick={() => openEditDialog(degree, "degree")}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            </CardHeader>
            <CardContent>
              {loadingSubjects ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
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
                    {subjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No hay asignaturas
                        </TableCell>
                      </TableRow>
                    )}
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-mono">
                          {subject.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {subject.name}
                        </TableCell>
                        <TableCell>{getDegreeName(subject.degreeId)}</TableCell>
                        <TableCell>{subject.credits} ECTS</TableCell>
                        <TableCell>{subject.semester}º</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(subject, "subject")}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- COURSES TAB (FILTRADO) --- */}
        <TabsContent value="courses">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            {/* Filtro de Años */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por año:</span>
              <Select
                value={selectedYearFilter}
                onValueChange={setSelectedYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Año Académico" />
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
                Mostrando {filteredCourses.length} cursos
                {selectedYearFilter !== "all"
                  ? ` del año ${selectedYearFilter}`
                  : " totales"}
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
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
                    {filteredCourses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No hay cursos para el filtro seleccionado
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredCourses.map((course) => {
                      const subject = subjects.find(
                        (s) => s.id === course.subjectId
                      );
                      const degreeName = subject
                        ? getDegreeName(subject.degreeId)
                        : "-";

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
                            {degreeName}
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
                              onClick={() => openEditDialog(course, "course")}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
