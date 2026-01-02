import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
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
  Trash2,
  Eye,
  ChevronRight,
  Building,
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
import { Textarea } from "@/components/ui/forms/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/layout/card";
import { Button } from "@/components/ui/forms/button";
import { Label } from "@/components/ui/forms/label";
import { Badge } from "@/components/ui/data/badge";

const degrees = [
  {
    id: "1",
    name: "Grado en Ingeniería Informática",
    code: "GII",
    subjects: [
      {
        id: "1-1",
        name: "Estructuras de Datos",
        groups: 3,
        students: 120,
        exercises: 35,
      },
      {
        id: "1-2",
        name: "Algoritmos",
        groups: 2,
        students: 80,
        exercises: 28,
      },
      {
        id: "1-3",
        name: "Programación Orientada a Objetos",
        groups: 3,
        students: 115,
        exercises: 42,
      },
    ],
  },
  {
    id: "2",
    name: "Grado en Ingeniería del Software",
    code: "GIS",
    subjects: [
      {
        id: "2-1",
        name: "Fundamentos de Programación",
        groups: 2,
        students: 75,
        exercises: 25,
      },
      {
        id: "2-2",
        name: "Programación Avanzada",
        groups: 2,
        students: 60,
        exercises: 30,
      },
    ],
  },
];

const professors = [
  {
    id: "1",
    name: "Dr. Juan Martínez",
    email: "juan.martinez@universidad.edu",
    subjects: 2,
    groups: 4,
  },
  {
    id: "2",
    name: "Dra. Elena López",
    email: "elena.lopez@universidad.edu",
    subjects: 1,
    groups: 2,
  },
  {
    id: "3",
    name: "Dr. Miguel Sánchez",
    email: "miguel.sanchez@universidad.edu",
    subjects: 3,
    groups: 5,
  },
];

const AdminDashboard = () => {
  const [createDegreeOpen, setCreateDegreeOpen] = useState(false);
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona titulaciones, asignaturas, grupos y ejercicios
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree-code">Código</Label>
                  <Input id="degree-code" placeholder="Ej: GII" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDegreeOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setCreateDegreeOpen(false)}>
                  Crear titulación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={createExerciseOpen}
            onOpenChange={setCreateExerciseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo ejercicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ejercicio</DialogTitle>
                <DialogDescription>
                  Configura un nuevo ejercicio de programación.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercise-title">Título</Label>
                    <Input
                      id="exercise-title"
                      placeholder="Ej: Búsqueda Binaria"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exercise-difficulty">Dificultad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exercise-description">Enunciado</Label>
                  <Textarea
                    id="exercise-description"
                    placeholder="Describe el ejercicio..."
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-limit">Tiempo límite (min)</Label>
                    <Input id="time-limit" type="number" placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memory-limit">Memoria (MB)</Label>
                    <Input id="memory-limit" type="number" placeholder="256" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Máx. intentos</Label>
                    <Input id="max-attempts" type="number" placeholder="5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lenguajes permitidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Python", "Java", "C++", "C", "JavaScript"].map(
                      (lang) => (
                        <Badge
                          key={lang}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10">
                          {lang}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateExerciseOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setCreateExerciseOpen(false)}>
                  Crear ejercicio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Titulaciones"
          value={2}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Asignaturas"
          value={5}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Profesores"
          value={3}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Ejercicios Totales"
          value={160}
          icon={<FileCode className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Degrees & Subjects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Estructura Académica
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {degrees.map((degree) => (
                  <AccordionItem key={degree.id} value={degree.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{degree.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Código: {degree.code} • {degree.subjects.length}{" "}
                            asignaturas
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2 pl-[52px]">
                        {degree.subjects.map((subject) => (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium text-sm">
                                  {subject.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {subject.groups} grupos • {subject.students}{" "}
                                  estudiantes • {subject.exercises} ejercicios
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2">
                          <Plus className="h-4 w-4 mr-1" />
                          Añadir asignatura
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Professors */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Profesores</CardTitle>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {professors.map((prof) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                      {prof.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{prof.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {prof.subjects} asignaturas • {prof.groups} grupos
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estadísticas Globales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estudiantes activos
                </span>
                <span className="font-medium">450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Envíos hoy
                </span>
                <span className="font-medium">234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tasa de éxito global
                </span>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary">
                  72%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tiempo medio resolución
                </span>
                <span className="font-medium">18 min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
