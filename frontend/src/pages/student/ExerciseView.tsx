import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CodeEditor } from "@/components/code/CodeEditor";
import { TestResults, TestStatus } from "@/components/code/TestResults";
import { Button } from "@/components/ui/forms/button";
import { Badge } from "@/components/ui/data/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/layout/tabs";
import { Clock, FileCode, History, Lightbulb, BookOpen } from "lucide-react";

// MOCK DATA
const exerciseData = {
  id: "2",
  title: "Búsqueda Binaria",
  description: `Implementa el algoritmo de búsqueda binaria para encontrar un elemento en un array ordenado de enteros.

La búsqueda binaria es un algoritmo eficiente que funciona dividiendo repetidamente a la mitad el espacio de búsqueda. En cada paso, compara el elemento central con el valor buscado y descarta la mitad que no puede contener el elemento.

## Entrada
- La primera línea contiene un entero N (1 ≤ N ≤ 10^6), el tamaño del array.
- La segunda línea contiene N enteros ordenados de menor a mayor.
- La tercera línea contiene un entero Q (1 ≤ Q ≤ 10^5), el número de consultas.
- Las siguientes Q líneas contienen cada una un entero X a buscar.

## Salida
Para cada consulta, imprime el índice del elemento si existe, o -1 si no se encuentra.

## Ejemplo
**Entrada:**
\`\`\`
5
1 3 5 7 9
3
3
6
9
\`\`\`

**Salida:**
\`\`\`
1
-1
4
\`\`\``,
  difficulty: "medium",
  timeLimit: 45,
  memoryLimit: 256,
  subject: "Estructuras de Datos",
  topic: "Tema 3: Algoritmos de Búsqueda",
  dueDate: "15 Enero 2026",
  attempts: 0,
  maxAttempts: 5,
};

const initialTestCases = [
  {
    id: 1,
    name: "Caso de prueba 1",
    status: "pending" as TestStatus,
    input: "5\n1 3 5 7 9\n1\n5",
    expectedOutput: "2",
    isPublic: true,
  },
  {
    id: 2,
    name: "Caso de prueba 2",
    status: "pending" as TestStatus,
    input: "5\n1 3 5 7 9\n1\n6",
    expectedOutput: "-1",
    isPublic: true,
  },
  {
    id: 3,
    name: "Caso de prueba 3",
    status: "pending" as TestStatus,
    isPublic: false,
  },
  {
    id: 4,
    name: "Caso de prueba 4",
    status: "pending" as TestStatus,
    isPublic: false,
  },
  {
    id: 5,
    name: "Caso de prueba 5",
    status: "pending" as TestStatus,
    isPublic: false,
  },
];

const submissions = [
  {
    id: 1,
    date: "10 Ene 2026, 14:32",
    verdict: "Respuesta Incorrecta",
    passedTests: "2/5",
  },
  {
    id: 2,
    date: "10 Ene 2026, 14:45",
    verdict: "Tiempo Excedido",
    passedTests: "3/5",
  },
];

const ExerciseView = () => {
  const { id } = useParams();
  const [testCases, setTestCases] = useState(initialTestCases);
  const [isRunning, setIsRunning] = useState(false);
  const [verdict, setVerdict] = useState<string | undefined>(undefined);

  const handleSubmit = (code: string, language: string) => {
    setIsRunning(true);
    setVerdict(undefined);

    // Simulation Logic
    let currentTest = 0;
    const runNextTest = () => {
      if (currentTest < testCases.length) {
        setTestCases((prev) =>
          prev.map((t, i) =>
            i === currentTest ? { ...t, status: "running" as TestStatus } : t
          )
        );

        setTimeout(() => {
          const passed = Math.random() > 0.3;
          setTestCases((prev) =>
            prev.map((t, i) =>
              i === currentTest
                ? {
                    ...t,
                    status: (passed ? "passed" : "failed") as TestStatus,
                    actualOutput: passed ? t.expectedOutput : "3",
                    executionTime: Math.floor(Math.random() * 50) + 10,
                  }
                : t
            )
          );
          currentTest++;
          runNextTest();
        }, 500);
      } else {
        setIsRunning(false);
        const passedCount = testCases.filter(
          (t) => t.status === "passed"
        ).length;
        setVerdict(
          passedCount === testCases.length ? "Aceptado" : "Respuesta Incorrecta"
        );
      }
    };

    setTestCases((prev) =>
      prev.map((t) => ({ ...t, status: "pending" as TestStatus }))
    );
    setTimeout(runNextTest, 300);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className="bg-chart-4/20 text-chart-4 border-chart-4/30">
              Media
            </Badge>
            <span className="text-sm text-muted-foreground">
              {exerciseData.subject} • {exerciseData.topic}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{exerciseData.title}</h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{exerciseData.timeLimit} min</span>
          </div>
          <div className="flex items-center gap-1">
            <FileCode className="h-4 w-4" />
            <span>
              Intentos: {exerciseData.attempts}/{exerciseData.maxAttempts}
            </span>
          </div>
          <Badge variant="secondary">Entrega: {exerciseData.dueDate}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column - Problem Statement */}
        <div className="flex flex-col h-full min-h-[500px]">
          <Tabs defaultValue="statement" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="statement">
                <BookOpen className="h-4 w-4 mr-2" />
                Enunciado
              </TabsTrigger>
              <TabsTrigger value="hints">
                <Lightbulb className="h-4 w-4 mr-2" />
                Pistas
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="statement" className="flex-1 mt-4">
              <Card className="h-full">
                <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none overflow-y-auto max-h-[600px] custom-scrollbar">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {exerciseData.description.split("\n").map((line, i) => {
                      if (line.startsWith("## "))
                        return (
                          <h3
                            key={i}
                            className="text-lg font-semibold mt-4 mb-2">
                            {line.replace("## ", "")}
                          </h3>
                        );
                      if (line.startsWith("**") && line.endsWith("**"))
                        return (
                          <p key={i} className="font-semibold mt-3">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      if (line.startsWith("```")) return null;
                      if (line.trim() === "") return <br key={i} />;
                      return (
                        <p key={i} className="text-muted-foreground">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hints" className="flex-1 mt-4">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-chart-4" />
                    <p className="font-medium mb-2">¿Necesitas ayuda?</p>
                    <p className="text-sm mb-4">
                      Las pistas pueden reducir tu puntuación máxima en un 10%.
                    </p>
                    <Button variant="outline">Ver pista 1</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">
                    Historial de Envíos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length > 0 ? (
                    <div className="space-y-3">
                      {submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div>
                            <p className="font-medium text-sm">{sub.verdict}</p>
                            <p className="text-xs text-muted-foreground">
                              {sub.date}
                            </p>
                          </div>
                          <Badge variant="secondary">{sub.passedTests}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      Aún no has realizado ningún envío.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 flex flex-col h-full">
          <div className="flex-1 min-h-[400px]">
            <CodeEditor
              initialCode={`def binary_search(arr, target):\n    # Tu implementación aquí\n    pass`}
              onSubmit={handleSubmit}
            />
          </div>
          <div className="min-h-[200px]">
            <TestResults
              testCases={testCases}
              isRunning={isRunning}
              verdict={verdict}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseView;
