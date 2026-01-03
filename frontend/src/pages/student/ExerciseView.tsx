import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios"; // <--- Importante para tipar el error
import { CodeEditor } from "@/components/code/CodeEditor";
import { TestResults } from "@/components/code/TestResults";
import { SubmissionHistory } from "@/components/exercise/SubmissionHistory";
import { HintPanel } from "@/components/exercise/HintPanel";
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
import {
  SubmissionResponse,
  SubmissionHistoryItem,
} from "@/types/exercise.types";

export default function ExerciseView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("statement");
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResponse | null>(null);
  const [currentCode, setCurrentCode] = useState<string | undefined>(undefined);

  const {
    data: exercise,
    isLoading: isLoadingExercise,
    error,
  } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => exerciseService.getById(id!),
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["exerciseHistory", id],
    queryFn: () => exerciseService.getHistory(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (history && history.length > 0 && !submissionResult && !currentCode) {
      const latestSubmission = history[0];
      setSubmissionResult(latestSubmission as unknown as SubmissionResponse);

      if (latestSubmission.code) {
        setCurrentCode(latestSubmission.code);
      }
    } else if (exercise && !currentCode && history.length === 0) {
      setCurrentCode(
        exercise.templateCode ||
          `# Write your solution in ${exercise.language || "python"}`
      );
    }
  }, [history, exercise, submissionResult, currentCode]);

  const handleSelectSubmission = (sub: SubmissionHistoryItem) => {
    if (sub.code) setCurrentCode(sub.code);
    setSubmissionResult(sub as unknown as SubmissionResponse);
    toast({
      description: "Versión cargada del historial.",
    });
  };

  const submitMutation = useMutation({
    mutationFn: exerciseService.submitSolution,
    onSuccess: (data) => {
      setSubmissionResult(data);
      queryClient.invalidateQueries({ queryKey: ["exerciseHistory", id] });

      toast({
        title: t("exercise.submission.success_title"),
        description: `${t("exercise.submission.verdict")}: ${data.verdict}`,
        variant: data.verdict === "accepted" ? "default" : "destructive",
      });
    },
    onError: (err) => {
      console.log("Error de envío:", err);

      let description = t("exercise.submission.error_desc");

      if (err instanceof AxiosError && err.response?.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = err.response.data as any;

        if (data.message) {
          description = data.message;
        } else if (data.error) {
          description =
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error);
        }
      }

      toast({
        title: t("exercise.submission.error_title"),
        description: description,
        variant: "destructive",
      });
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

  if (isLoadingExercise) {
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
        {/* Left Column - Tabs */}
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

            <TabsContent value="hints" className="flex-1 mt-4 min-h-0">
              <Card className="h-full flex flex-col">
                <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                  <HintPanel lastSubmission={submissionResult} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-4 min-h-0">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("exercise.tabs.history")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                  <SubmissionHistory
                    history={history}
                    onSelectSubmission={handleSelectSubmission}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Editor */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex-1 min-h-[400px]">
            <CodeEditor
              key={currentCode ? "with-content" : "default"}
              initialCode={currentCode}
              language={exercise.language}
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
