import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/layout/card";
import { Badge } from "../ui/data/badge";

export type TestStatus =
  | "passed"
  | "failed"
  | "timeout"
  | "error"
  | "running"
  | "pending";

interface TestCase {
  id: number;
  name: string;
  status: TestStatus;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTime?: number;
  isPublic: boolean;
}

interface TestResultsProps {
  testCases: TestCase[];
  isRunning?: boolean;
  verdict?: string;
}

const statusConfig = {
  passed: {
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Correcto",
  },
  failed: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Incorrecto",
  },
  timeout: {
    icon: Clock,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    label: "Tiempo excedido",
  },
  error: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Error",
  },
  running: {
    icon: Loader2,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Ejecutando",
  },
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    label: "Pendiente",
  },
};

export const TestResults = ({
  testCases,
  isRunning,
  verdict,
}: TestResultsProps) => {
  const passedCount = testCases.filter((t) => t.status === "passed").length;
  const totalCount = testCases.length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resultados de Pruebas</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {passedCount}/{totalCount} pasados
            </span>
            {verdict && (
              <Badge
                variant="outline"
                className={
                  verdict === "Aceptado"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-destructive/10 text-destructive border-destructive/30"
                }>
                {verdict}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {testCases.map((test) => {
          const config = statusConfig[test.status];
          const Icon = config.icon;

          return (
            <div
              key={test.id}
              className={`p-4 rounded-lg border border-border ${config.bg} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-5 w-5 ${config.color} ${
                      test.status === "running" ? "animate-spin" : ""
                    }`}
                  />
                  <span className="font-medium">
                    {test.name}
                    {!test.isPublic && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (oculto)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {test.executionTime !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {test.executionTime}ms
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
              </div>

              {test.isPublic &&
                test.status !== "pending" &&
                test.status !== "running" && (
                  <div className="mt-3 space-y-2 text-sm font-mono">
                    {test.input && (
                      <div className="p-2 rounded bg-card">
                        <span className="text-muted-foreground">Entrada: </span>
                        <span>{test.input}</span>
                      </div>
                    )}
                    {test.expectedOutput && (
                      <div className="p-2 rounded bg-card">
                        <span className="text-muted-foreground">
                          Esperado:{" "}
                        </span>
                        <span className="text-primary">
                          {test.expectedOutput}
                        </span>
                      </div>
                    )}
                    {test.actualOutput && test.status === "failed" && (
                      <div className="p-2 rounded bg-card">
                        <span className="text-muted-foreground">
                          Obtenido:{" "}
                        </span>
                        <span className="text-destructive">
                          {test.actualOutput}
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}

        {isRunning && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Ejecutando pruebas...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
