import { StatCard } from "@/components/ui/data/stat-card";
import { ExerciseCard } from "@/components/ui/data/exercise-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Progress } from "@/components/ui/feedback/progress";
import { Button } from "@/components/ui/forms/button";
import {
  FileCode,
  CheckCircle2,
  Clock,
  TrendingUp,
  BookOpen,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

const recentExercises = [
  {
    id: "1",
    title: "Ordenación por Burbuja",
    description:
      "Implementa el algoritmo de ordenación por burbuja para ordenar un array de enteros.",
    difficulty: "easy" as const,
    status: "completed" as const,
    timeLimit: 30,
    attempts: 2,
    maxAttempts: 5,
  },
  {
    id: "2",
    title: "Búsqueda Binaria",
    description:
      "Implementa el algoritmo de búsqueda binaria para encontrar un elemento en un array ordenado.",
    difficulty: "medium" as const,
    status: "pending" as const,
    timeLimit: 45,
    attempts: 0,
    maxAttempts: 5,
    dueDate: "15 Ene 2026",
  },
  {
    id: "3",
    title: "Árbol Binario de Búsqueda",
    description:
      "Implementa las operaciones básicas de un árbol binario de búsqueda: inserción, búsqueda y eliminación.",
    difficulty: "hard" as const,
    status: "failed" as const,
    timeLimit: 60,
    attempts: 3,
    maxAttempts: 5,
  },
];

const subjectProgress = [
  { name: "Estructuras de Datos", progress: 75, total: 20, completed: 15 },
  { name: "Algoritmos", progress: 40, total: 15, completed: 6 },
  {
    name: "Programación Orientada a Objetos",
    progress: 90,
    total: 10,
    completed: 9,
  },
];

const StudentDashboard = () => {
  return (
    <div className="space-y-6 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenida, María!
        </h1>
        <p className="text-muted-foreground">
          Continúa donde lo dejaste. Tienes 3 ejercicios pendientes esta semana.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ejercicios Completados"
          value={30}
          description="de 45 totales"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Tasa de Éxito"
          value="85%"
          description="en el primer intento"
          icon={<Target className="h-5 w-5" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Ejercicios Pendientes"
          value={5}
          description="esta semana"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Racha Actual"
          value="7 días"
          description="mejor: 12 días"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Exercises */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              Ejercicios Recientes
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/exercises">Ver todos</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} {...exercise} />
            ))}
          </div>
        </div>

        {/* Progress by Subject */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Progreso por Asignatura
          </h2>

          <div className="space-y-4">
            {subjectProgress.map((subject) => (
              <Card key={subject.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{subject.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {subject.completed}/{subject.total}
                    </span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {subject.progress}% completado
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild>
                <Link to="/dashboard/exercises">
                  <FileCode className="h-4 w-4 mr-2" />
                  Ver todos los ejercicios
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild>
                <Link to="/dashboard/progress">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver mi progreso
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
