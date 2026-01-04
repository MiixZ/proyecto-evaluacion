/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import { Textarea } from "@/components/ui/forms/textarea";
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
import { Checkbox } from "@/components/ui/forms/checkbox";
import { toast } from "@/hooks/use-toast";
import { CodeEditor } from "@/components/code/CodeEditor";

import { syllabusService } from "@/services/syllabus.service";
import {
  exerciseService,
  CreateExercisePayload,
} from "@/services/exercise.service";
import { dashboardService } from "@/services/dashboard.service";

type TestCaseForm = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  timeLimitSeconds: number;
  memoryLimitMb: number;
  hintText: string;
  hintPenaltyPercent: number;
};

export default function CreateExercise() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const initialGroupId = localStorage.getItem("professorLastGroupId");

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [syllabusId, setSyllabusId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [language, setLanguage] = useState("python");
  const [points, setPoints] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [latePenalty, setLatePenalty] = useState(0);
  const [templateCode, setTemplateCode] = useState("");

  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    {
      id: crypto.randomUUID(),
      input: "",
      expectedOutput: "",
      isHidden: false,
      timeLimitSeconds: 2,
      memoryLimitMb: 128,
      hintText: "",
      hintPenaltyPercent: 0,
    },
  ]);

  const { data: dashboardData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["professorStats"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const groups = useMemo(
    () => dashboardData?.groups || [],
    [dashboardData?.groups]
  );

  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId);

  const { data: syllabi, isLoading: isLoadingSyllabi } = useQuery({
    queryKey: ["syllabi", selectedGroup?.courseId],
    queryFn: () => syllabusService.getByCourse(selectedGroup!.courseId),
    enabled: !!selectedGroup?.courseId,
  });

  useEffect(() => {
    setSyllabusId("");
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].groupId);
    }
  }, [groups, selectedGroupId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateExercisePayload) =>
      exerciseService.create(payload),
    onSuccess: () => {
      toast({
        title: "Ejercicio creado",
        description: "El ejercicio se ha guardado correctamente.",
      });
      navigate("/dashboard/exercises");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al crear el ejercicio",
        variant: "destructive",
      });
    },
  });

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: crypto.randomUUID(),
        input: "",
        expectedOutput: "",
        isHidden: false,
        timeLimitSeconds: 2,
        memoryLimitMb: 128,
        hintText: "",
        hintPenaltyPercent: 0,
      },
    ]);
  };

  const handleRemoveTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id));
    }
  };

  const updateTestCase = (
    id: string,
    field: keyof TestCaseForm,
    value: any
  ) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!syllabusId) {
      toast({
        title: "Falta información",
        description: "Debes seleccionar un temario.",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateExercisePayload = {
      syllabusId,
      title,
      description,
      difficulty,
      language,
      templateCode: templateCode || undefined,
      points,
      maxAttempts,
      lateSubmissionPenaltyPercent: latePenalty,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      testCases: testCases.map(({ id, ...rest }) => rest),
    };

    createMutation.mutate(payload);
  };

  if (isLoadingGroups) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Crear Nuevo Ejercicio
            </h1>
            <p className="text-muted-foreground">
              Define el enunciado y las pruebas automáticas
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Ejercicio
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Detalles básicos del problema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SELECTOR DE CURSO/ASIGNATURA */}
              <div className="space-y-2">
                <Label>Asignatura / Grupo</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.groupId} value={g.groupId}>
                        {g.subjectName} ({g.groupName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El ejercicio se creará en el curso asociado a este grupo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título del Ejercicio</Label>
                <Input
                  id="title"
                  placeholder="Ej: Calcular Factorial"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Enunciado (Markdown soportado)
                </Label>
                <Textarea
                  id="description"
                  className="min-h-[150px] font-mono text-sm"
                  placeholder="Describe el problema, entradas y salidas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temario / Unidad</Label>
                  <Select
                    value={syllabusId}
                    onValueChange={setSyllabusId}
                    disabled={!selectedGroupId || isLoadingSyllabi}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingSyllabi
                            ? "Cargando..."
                            : "Seleccionar tema..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {syllabi?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title} ({s.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v: any) => setDifficulty(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor de Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle>Plantilla de Código (Opcional)</CardTitle>
              <CardDescription>
                Código inicial que verá el estudiante. Selecciona el lenguaje
                principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-48">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lenguaje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md overflow-hidden h-[300px]">
                <CodeEditor
                  language={language}
                  initialCode={templateCode}
                  onChange={(val) => setTemplateCode(val || "")}
                  readOnly={false}
                  showSubmitButton={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Casos de Prueba */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Casos de Prueba</CardTitle>
                <CardDescription>
                  Define las entradas y salidas esperadas para la validación
                  automática.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddTestCase}>
                <Plus className="mr-2 h-4 w-4" /> Añadir Caso
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="relative p-4 border rounded-lg bg-muted/20 space-y-4">
                  <div className="absolute right-4 top-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveTestCase(tc.id)}
                      disabled={testCases.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      Caso #{index + 1}
                    </span>
                    <div className="flex items-center space-x-2 ml-4">
                      <Checkbox
                        id={`hidden-${tc.id}`}
                        checked={tc.isHidden}
                        onCheckedChange={(c) =>
                          updateTestCase(tc.id, "isHidden", !!c)
                        }
                      />
                      <Label
                        htmlFor={`hidden-${tc.id}`}
                        className="text-sm font-normal">
                        Oculto al estudiante (Caso privado)
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Entrada (stdin)</Label>
                      <Textarea
                        className="font-mono text-xs min-h-[80px]"
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(tc.id, "input", e.target.value)
                        }
                        placeholder="Ej: 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Salida Esperada (stdout)
                      </Label>
                      <Textarea
                        className="font-mono text-xs min-h-[80px]"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(
                            tc.id,
                            "expectedOutput",
                            e.target.value
                          )
                        }
                        placeholder="Ej: 120"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tiempo (s)</Label>
                      <Input
                        type="number"
                        className="h-8"
                        value={tc.timeLimitSeconds}
                        onChange={(e) =>
                          updateTestCase(
                            tc.id,
                            "timeLimitSeconds",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Memoria (MB)</Label>
                      <Input
                        type="number"
                        className="h-8"
                        value={tc.memoryLimitMb}
                        onChange={(e) =>
                          updateTestCase(
                            tc.id,
                            "memoryLimitMb",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" /> Pista (opcional)
                        </Label>
                        <Input
                          placeholder="Ej: Usa recursividad..."
                          className="h-8 text-sm"
                          value={tc.hintText}
                          onChange={(e) =>
                            updateTestCase(tc.id, "hintText", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Penalización Pista (%)
                        </Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={tc.hintPenaltyPercent}
                          onChange={(e) =>
                            updateTestCase(
                              tc.id,
                              "hintPenaltyPercent",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Configuración */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Puntos Máximos</Label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Intentos Máximos</Label>
                <Input
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Límite</Label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Penalización por retraso (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(Number(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
