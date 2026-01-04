import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileCode,
  HardDrive,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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
import FeedbackPanel from "@/components/feedback/FeedbackPanel";

import { submissionService } from "@/services/submission.service";
import { exportService } from "@/services/export.service";

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
      console.error(err);
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
      {/* HEADER SUPERIOR */}
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

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* COLUMNA IZQUIERDA: EDITOR DE CÓDIGO (Sólo lectura) */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden border-muted h-full">
          <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="uppercase bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                {submission.language}
              </span>
              <span className="text-muted-foreground">
                main.
                {submission.language === "python"
                  ? "py"
                  : submission.language === "javascript"
                  ? "js"
                  : "txt"}
              </span>
            </div>
          </CardHeader>
          <div className="flex-1 min-h-0 relative bg-[#1e1e1e]">
            <CodeEditor
              initialCode={submission.code}
              language={submission.language}
              readOnly={true}
              showSubmitButton={false}
            />
          </div>
        </Card>

        {/* COLUMNA DERECHA: DATOS + FEEDBACK + TESTS */}
        <div className="flex flex-col gap-6 overflow-hidden h-full">
          {/* TARJETA DE ESTUDIANTE (Fija arriba) */}
          <Card className="shrink-0 border-muted">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={submission.student.avatarUrl || undefined}
                  />
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

          {/* AREA SCROLLABLE PARA EL RESTO DE CONTENIDO */}
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="flex flex-col gap-6 pb-2">
              {/* MÉTRICAS DE EJECUCIÓN */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold">{submission.score}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1 tracking-wider">
                      Puntuación
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col justify-center gap-2 h-full">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" /> Tiempo
                      </span>
                      <span className="font-mono font-medium">
                        {submission.executionTimeMs || 0}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <HardDrive className="h-3 w-3" /> Memoria
                      </span>
                      <span className="font-mono font-medium">
                        {submission.memoryUsedMb || 0}MB
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PANEL DE FEEDBACK (Componente Nuevo) */}
              <FeedbackPanel submissionId={submission.id} />

              {/* RESULTADOS DE LOS TESTS */}
              <Card className="border-muted">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Casos de Prueba
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {
                        submission.testResults.filter(
                          (t) => t.status === "passed"
                        ).length
                      }{" "}
                      / {submission.testResults.length}
                    </Badge>
                  </div>
                </CardHeader>
                <div className="divide-y divide-border">
                  {submission.testResults.map((test, index) => (
                    <div
                      key={test.id || index}
                      className={`p-3 text-sm flex flex-col gap-2 transition-colors ${
                        test.status === "failed" || test.status === "error"
                          ? "bg-red-50/30"
                          : "hover:bg-muted/30"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              test.status === "passed"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="font-medium">Test #{index + 1}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {test.executionTimeMs}ms
                        </span>
                      </div>

                      {/* Detalles del error (solo si falló) */}
                      {(test.status === "failed" ||
                        test.status === "error") && (
                        <div className="mt-1 text-xs bg-background border rounded p-2 space-y-2">
                          {test.errorMessage && (
                            <div className="text-red-600 font-medium mb-1">
                              {test.errorMessage}
                            </div>
                          )}
                          <div className="grid grid-cols-1 gap-1">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground w-16 shrink-0">
                                Entrada:
                              </span>
                              <code className="bg-muted px-1 rounded flex-1 truncate">
                                {test.input}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-green-600 w-16 shrink-0">
                                Esperado:
                              </span>
                              <code className="bg-green-50 text-green-700 px-1 rounded flex-1 truncate">
                                {test.expectedOutput}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-red-600 w-16 shrink-0">
                                Obtenido:
                              </span>
                              <code className="bg-red-50 text-red-700 px-1 rounded flex-1 truncate">
                                {test.actualOutput || "(vacío)"}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
