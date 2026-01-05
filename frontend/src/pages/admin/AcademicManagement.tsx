// frontend/src/pages/admin/AcademicManagement.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("degrees");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtros y paginación
  const [degreeSearch, setDegreeSearch] = useState("");
  const [degreePage, setDegreePage] = useState(1);
  const [degreeLimit, setDegreeLimit] = useState(10);

  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectLimit, setSubjectLimit] = useState(10);

  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [courseLimit, setCourseLimit] = useState(10);

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

  // --- Mutations ---
  const createDegreeMutation = useMutation({
    mutationFn: academicService.createDegree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
      toast.success("Titulación creada correctamente");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Error al crear titulación"),
  });

  const createSubjectMutation = useMutation({
    mutationFn: academicService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Asignatura creada correctamente");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Error al crear asignatura"),
  });

  const createCourseMutation = useMutation({
    mutationFn: academicService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Curso creado correctamente");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Error al crear curso"),
  });

  const DegreeForm = () => {
    const { register, handleSubmit } = useForm<Degree>();
    return (
      <form
        onSubmit={handleSubmit((data) =>
          createDegreeMutation.mutate({
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
        <Button
          type="submit"
          className="w-full"
          disabled={createDegreeMutation.isPending}>
          {createDegreeMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Crear Titulación
        </Button>
      </form>
    );
  };

  const SubjectForm = () => {
    const { register, handleSubmit, setValue } = useForm<Subject>();
    return (
      <form
        onSubmit={handleSubmit((data) =>
          createSubjectMutation.mutate({
            ...data,
            credits: Number(data.credits),
            semester: Number(data.semester),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Titulación a la que pertenece</Label>
          <Select onValueChange={(val) => setValue("degreeId", val)} required>
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
          <Label>Semestre (Global)</Label>
          <Input type="number" {...register("semester")} placeholder="1-8" />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={createSubjectMutation.isPending}>
          {createSubjectMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Crear Asignatura
        </Button>
      </form>
    );
  };

  const CourseForm = () => {
    const { register, handleSubmit, setValue } = useForm<Course>();
    return (
      <form
        onSubmit={handleSubmit((data) =>
          createCourseMutation.mutate({
            ...data,
            semester: Number(data.semester),
          })
        )}
        className="space-y-4">
        <div className="space-y-2">
          <Label>Asignatura</Label>
          <Select onValueChange={(val) => setValue("subjectId", val)} required>
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
              defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1er Semestre</SelectItem>
                <SelectItem value="2">2do Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={createCourseMutation.isPending}>
          {createCourseMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Crear Curso
        </Button>
      </form>
    );
  };

  // Funciones de filtrado y paginación
  const filterAndPaginate = <
    T extends { name?: string; code?: string; academicYear?: string }
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
  const filteredCourses = filterAndPaginate(
    courses,
    courseSearch,
    coursePage,
    courseLimit
  );

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "Desconocida";
  const getDegreeName = (id: string) =>
    degrees.find((d) => d.id === id)?.name || "Desconocida";

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {activeTab === "degrees" && "Nueva Titulación"}
              {activeTab === "subjects" && "Nueva Asignatura"}
              {activeTab === "courses" && "Nuevo Curso"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeTab === "degrees" && "Crear Nueva Titulación"}
                {activeTab === "subjects" && "Crear Nueva Asignatura"}
                {activeTab === "courses" && "Abrir Nuevo Curso"}
              </DialogTitle>
            </DialogHeader>
            {activeTab === "degrees" && <DegreeForm />}
            {activeTab === "subjects" && <SubjectForm />}
            {activeTab === "courses" && <CourseForm />}
          </DialogContent>
        </Dialog>
      </div>

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
            <Calendar className="h-4 w-4" /> Cursos Activos
          </TabsTrigger>
        </TabsList>

        {/* --- DEGREES TAB --- */}
        <TabsContent value="degrees">
          <Card>
            <CardHeader>
              <CardTitle>Titulaciones Ofertadas</CardTitle>
              <CardDescription>
                Listado de grados y másteres disponibles en la plataforma.
              </CardDescription>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDegrees.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
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
          <Card>
            <CardHeader>
              <CardTitle>Asignaturas</CardTitle>
              <CardDescription>
                Catálogo de asignaturas asociadas a titulaciones.
              </CardDescription>
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
                        <TableHead>Semestre (Plan)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
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

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Académicos</CardTitle>
              <CardDescription>
                Instancias de asignaturas impartidas en un año específico.
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
                        <TableHead>Año Académico</TableHead>
                        <TableHead>Asignatura</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground">
                            No se encontraron cursos
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCourses.items.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell>{course.academicYear}</TableCell>
                            <TableCell className="font-medium">
                              {getSubjectName(course.subjectId)}
                            </TableCell>
                            <TableCell>
                              {course.semester === 1
                                ? "1º Semestre"
                                : "2º Semestre"}
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
                          </TableRow>
                        ))
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
      </Tabs>
    </div>
  );
}
