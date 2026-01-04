import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/layout/card";
import { CodeEditor } from "@/components/code/CodeEditor";
import { submissionService } from "@/services/submission.service";

export default function SubmissionComparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sourceId = searchParams.get("source");
  const targetId = searchParams.get("target");

  const { data: sourceSub, isLoading: load1 } = useQuery({
    queryKey: ["submission", sourceId],
    queryFn: () => submissionService.getById(sourceId!),
    enabled: !!sourceId,
  });

  const { data: targetSub, isLoading: load2 } = useQuery({
    queryKey: ["submission", targetId],
    queryFn: () => submissionService.getById(targetId!),
    enabled: !!targetId,
  });

  if (load1 || load2) return <div className="p-8 text-center">Cargando...</div>;
  if (!sourceSub || !targetSub)
    return <div className="p-8">Error cargando envíos</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 p-4 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Comparar Intentos</h1>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <Card className="flex flex-col h-full border-l-4 border-l-blue-500">
          <CardHeader className="py-3 bg-muted/20">
            <CardTitle>Intento A (Más antiguo)</CardTitle>
            <CardDescription>
              {new Date(sourceSub.createdAt).toLocaleString()} - Nota:{" "}
              {sourceSub.score}
            </CardDescription>
          </CardHeader>
          <div className="flex-1 overflow-hidden relative">
            <CodeEditor
              initialCode={sourceSub.code}
              language={sourceSub.language}
              readOnly={true}
              showSubmitButton={false}
            />
          </div>
        </Card>

        <Card className="flex flex-col h-full border-l-4 border-l-green-500">
          <CardHeader className="py-3 bg-muted/20">
            <CardTitle>Intento B (Más reciente)</CardTitle>
            <CardDescription>
              {new Date(targetSub.createdAt).toLocaleString()} - Nota:{" "}
              {targetSub.score}
            </CardDescription>
          </CardHeader>
          <div className="flex-1 overflow-hidden relative">
            <CodeEditor
              initialCode={targetSub.code}
              language={targetSub.language}
              readOnly={true}
              showSubmitButton={false}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
