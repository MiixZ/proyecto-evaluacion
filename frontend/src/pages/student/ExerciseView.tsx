import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CodeEditor } from "@/components/code/CodeEditor";
import { TestResults } from "@/components/code/TestResults";
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
import {
  FileCode,
  History,
  Lightbulb,
  BookOpen,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { exerciseService } from "@/services/exercise.service";
import { useToast } from "@/hooks/use-toast";

export default function ExerciseView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("statement");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const {
    data: exercise,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => exerciseService.getById(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: exerciseService.submitSolution,
    onSuccess: (data) => {
      setSubmissionResult(data);
      toast({
        title: t("exercise.submission.success_title"),
        description: `${t("exercise.submission.verdict")}: ${data.verdict}`,
        variant: data.verdict === "accepted" ? "default" : "destructive",
      });
    },
    onError: (err) => {
      toast({
        title: t("exercise.submission.error_title"),
        description: t("exercise.submission.error_desc"),
        variant: "destructive",
      });
      console.error(err);
    },
  });

  const handleSubmit = (code: string, language: string) => {
    if (!id || !courseId) {
      toast({
        title: t("exercise.status.error_title"),
        description: t("exercise.status.missing_data"),
        variant: "destructive",
      });
      return;
    }

    setSubmissionResult(null);

    submitMutation.mutate({
      exerciseId: id,
      courseId: courseId,
      code,
      language: language || "python",
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const getDifficultyLabel = (diff: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`exercise.difficulty.${diff}` as any) || diff;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t("exercise.status.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("exercise.status.error_title")}</AlertTitle>
          <AlertDescription>{t("exercise.status.error_desc")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className={getDifficultyColor(exercise.difficulty)}>
              {getDifficultyLabel(exercise.difficulty)}
            </Badge>
            {/* Nota: Eliminado placeholder de Asignatura/Tema porque el backend no lo provee en este endpoint */}
          </div>
          <h1 className="text-2xl font-bold">{exercise.title}</h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>
              {t("exercise.info.points")}: {exercise.points}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <FileCode className="h-4 w-4" />
            <span>
              {t("exercise.info.max_attempts")}: {exercise.maxAttempts}
            </span>
          </div>

          {exercise.deadline && (
            <Badge variant="secondary">
              {t("exercise.info.deadline")}:{" "}
              {new Date(exercise.deadline).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column - Problem Statement */}
        <div className="flex flex-col h-full min-h-[500px]">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="statement">
                <BookOpen className="h-4 w-4 mr-2" />
                {t("exercise.tabs.statement")}
              </TabsTrigger>
              <TabsTrigger value="hints">
                <Lightbulb className="h-4 w-4 mr-2" />
                {t("exercise.tabs.hints")}
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                {t("exercise.tabs.history")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="statement" className="flex-1 mt-4 min-h-0">
              <Card className="h-full flex flex-col">
                <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {exercise.description.split("\n").map((line, i) => (
                      <p key={i} className="min-h-[1rem]">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hints" className="flex-1 mt-4">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-chart-4" />
                    <p>{t("exercise.hints.empty")}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("exercise.tabs.history")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">
                    {t("exercise.history.empty")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Editor & Results */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex-1 min-h-[400px]">
            <CodeEditor
              initialCode={
                exercise.templateCode ||
                `# Write your solution in ${exercise.language || "python"}`
              }
              onSubmit={handleSubmit}
              isSubmitting={submitMutation.isPending}
            />
          </div>
          <div className="min-h-[200px]">
            <TestResults
              testCases={submissionResult?.testResults || []}
              isRunning={submitMutation.isPending}
              verdict={submissionResult?.verdict}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
