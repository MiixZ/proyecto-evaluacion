import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Cpu,
  Download,
  FileCode,
  HardDrive,
  User,
  AlertCircle,
} from "lucide-react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/forms/button";
import { Badge } from "@/components/ui/data/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/data/avatar";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";

import { CodeEditor } from "@/components/code/CodeEditor";
import { submissionService } from "@/services/submission.service";
import { exportService } from "@/services/export.service";
import { toast } from "sonner";

export default function SubmissionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: submission,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionService.getById(id!),
    enabled: !!id,
  });

  const handleDownload = async (format: "zip" | "json") => {
    if (!submission) return;
    try {
      toast.info("Iniciando descarga...");
      await exportService.downloadSubmission(submission.id, format);
      toast.success("Descarga completada");
    } catch (err) {
      toast.error("Error en la descarga");
    }
  };

  const getVerdictBadge = (verdict: string) => {
    const styles: Record<string, string> = {
      accepted: "bg-green-100 text-green-800 border-green-200",
      wrong_answer: "bg-yellow-100 text-yellow-800 border-yellow-200",
      time_limit: "bg-orange-100 text-orange-800 border-orange-200",
      runtime_error: "bg-red-100 text-red-800 border-red-200",
      compilation_error: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const labels: Record<string, string> = {
      accepted: "Aceptado",
      wrong_answer: "Respuesta Incorrecta",
      time_limit: "Tiempo Excedido",
      runtime_error: "Error en Ejecución",
      compilation_error: "Error de Compilación",
      pending: "Pendiente",
    };

    return (
      <Badge variant="outline" className={styles[verdict] || styles.pending}>
        {labels[verdict] || verdict}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar la entrega. Es posible que no exista o no tengas
            permisos.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">
                Detalle de Entrega
              </h1>
              {getVerdictBadge(submission.verdict)}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <FileCode className="h-4 w-4" /> {submission.exercise.title}
              <span className="mx-1">•</span>
              <Calendar className="h-4 w-4" />
              {format(new Date(submission.createdAt), "PPP p", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("json")}>
            <Download className="mr-2 h-4 w-4" /> Reporte JSON
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleDownload("zip")}>
            <Download className="mr-2 h-4 w-4" /> Descargar Código
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
        {/* COLUMNA IZQUIERDA: EDITOR DE CÓDIGO (Read Only) */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden border-muted">
          <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="uppercase bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                {submission.language}
              </span>
              <span>
                main.
                {submission.language === "python"
                  ? "py"
                  : submission.language === "javascript"
                  ? "js"
                  : "java"}
              </span>
            </div>
          </CardHeader>
          <div className=" min-h-0 relative bg-[#1e1e1e]">
            <CodeEditor
              initialCode={submission.code}
              language={submission.language}
              readOnly={true}
              showSubmitButton={false}
            />
          </div>
        </Card>

        {/* COLUMNA DERECHA: INFORMACIÓN Y RESULTADOS */}
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* INFO DEL ESTUDIANTE */}
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={submission.student.avatarUrl} />
                  <AvatarFallback>
                    {submission.student.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {submission.student.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {submission.student.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MÉTRICAS */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold">{submission.score}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  Puntuación
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> Tiempo
                  </span>
                  <span className="font-medium">
                    {submission.executionTimeMs || 0} ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="h-3 w-3" /> Memoria
                  </span>
                  <span className="font-medium">
                    {submission.memoryUsedMb || 0} MB
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RESULTADOS DE LOS TESTS */}
          <Card className="flex-1 flex flex-col min-h-0 border-muted">
            <CardHeader className="py-3 px-4 border-b shrink-0">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Casos de Prueba</span>
                <Badge variant="secondary">
                  {
                    submission.testResults.filter((t) => t.status === "passed")
                      .length
                  }{" "}
                  / {submission.testResults.length} Pasados
                </Badge>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-0">
                {submission.testResults.map((test, index) => (
                  <div
                    key={test.id || index}
                    className={`p-3 border-b last:border-0 text-sm flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                      test.status === "failed" || test.status === "error"
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : ""
                    }`}>
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                        test.status === "passed" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />

                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Test #{index + 1}</span>
                        <span className="text-xs text-muted-foreground lowercase">
                          {test.executionTimeMs}ms
                        </span>
                      </div>

                      {/* Mostrar detalles solo si falló */}
                      {(test.status === "failed" ||
                        test.status === "error") && (
                        <div className="mt-2 space-y-2 bg-background p-2 rounded border text-xs font-mono overflow-x-auto">
                          {test.errorMessage && (
                            <div className="text-red-600 font-semibold mb-1">
                              Error: {test.errorMessage}
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground block mb-0.5">
                              Entrada:
                            </span>
                            <div className="bg-muted p-1 rounded">
                              {test.input}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-green-600 block mb-0.5">
                                Esperado:
                              </span>
                              <div className="bg-green-50 dark:bg-green-900/20 p-1 rounded text-green-700 dark:text-green-300">
                                {test.expectedOutput}
                              </div>
                            </div>
                            <div>
                              <span className="text-red-600 block mb-0.5">
                                Obtenido:
                              </span>
                              <div className="bg-red-50 dark:bg-red-900/20 p-1 rounded text-red-700 dark:text-red-300">
                                {test.actualOutput || "(vacío)"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
