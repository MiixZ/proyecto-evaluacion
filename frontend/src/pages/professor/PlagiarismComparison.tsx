import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/data/badge";
import { Textarea } from "@/components/ui/forms/textarea";
import { CodeEditor } from "@/components/code/CodeEditor"; //
import { plagiarismService } from "@/services/plagiarism.service";
import { submissionService } from "@/services/submission.service"; //
import { PlagiarismType } from "@/types/plagiarism.types";

export default function PlagiarismComparison() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: plagiarismData, isLoading: isLoadingCheck } = useQuery({
    queryKey: ["plagiarism", id],
    queryFn: () => plagiarismService.getById(id!),
    enabled: !!id,
  });

  const { data: sourceSubmission, isLoading: isLoadingSource } = useQuery({
    queryKey: ["submission", plagiarismData?.submissionId],
    queryFn: () => submissionService.getById(plagiarismData!.submissionId),
    enabled: !!plagiarismData?.submissionId,
  });

  const { data: targetSubmission, isLoading: isLoadingTarget } = useQuery({
    queryKey: ["submission", plagiarismData?.comparedWithSubmissionId],
    queryFn: () =>
      submissionService.getById(plagiarismData!.comparedWithSubmissionId),
    enabled: !!plagiarismData?.comparedWithSubmissionId,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ isFlagged }: { isFlagged: boolean }) =>
      plagiarismService.review(id!, reviewNotes, isFlagged),
    onSuccess: () => {
      toast.success(t("plagiarism.comparison.success"));
      queryClient.invalidateQueries({ queryKey: ["groupPlagiarism"] });
      navigate(-1);
    },
    onError: () => toast.error(t("plagiarism.comparison.error")),
  });

  const isLoading = isLoadingCheck || isLoadingSource || isLoadingTarget;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        {t("plagiarism.comparison.loading")}
      </div>
    );
  }

  if (!plagiarismData || !sourceSubmission || !targetSubmission) {
    return (
      <div className="p-8 text-center text-red-500">
        {t("plagiarism.comparison.not_found")}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 p-4 animate-in fade-in">
      {/* Header de navegación y acciones */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("plagiarism.comparison.back")}
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {t("plagiarism.comparison.title")}
              <Badge
                variant={
                  plagiarismData.similarityPercent > 80
                    ? "destructive"
                    : "secondary"
                }>
                {plagiarismData.similarityPercent}%{" "}
                {t("plagiarism.comparison.similarity")}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("plagiarism.comparison.subtitle", {
                date: format(new Date(plagiarismData.createdAt), "PPP p"),
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => reviewMutation.mutate({ isFlagged: false })}
            disabled={reviewMutation.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {t("plagiarism.comparison.dismiss")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => reviewMutation.mutate({ isFlagged: true })}
            disabled={reviewMutation.isPending}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t("plagiarism.comparison.confirm")}
          </Button>
        </div>
      </div>

      {/* Area de Comparación Split View */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Panel Izquierdo: Entrega Sospechosa */}
        <div className="flex flex-col gap-2 h-full">
          <Card className="flex flex-col h-full border-l-4 border-l-orange-500">
            <CardHeader className="py-3 px-4 bg-muted/20">
              <CardTitle className="text-sm font-medium">
                {t("plagiarism.comparison.student_suspected")}
              </CardTitle>
              <CardDescription className="text-xs">
                {sourceSubmission.student?.name ||
                  "ID: " + sourceSubmission.userId}
              </CardDescription>
            </CardHeader>
            <div className="flex-1 overflow-hidden relative">
              <CodeEditor
                initialCode={sourceSubmission.code}
                language={sourceSubmission.language || "javascript"}
                readOnly={true}
                showSubmitButton={false}
              />
            </div>
          </Card>
        </div>

        {/* Panel Derecho: Entrega Original/Comparada */}
        <div className="flex flex-col gap-2 h-full">
          <Card className="flex flex-col h-full border-l-4 border-l-blue-500">
            <CardHeader className="py-3 px-4 bg-muted/20">
              <CardTitle className="text-sm font-medium">
                {t("plagiarism.comparison.compared_with")}
              </CardTitle>
              <CardDescription className="text-xs">
                {plagiarismData.plagiarismType === PlagiarismType.INTERNAL
                  ? t("plagiarism.comparison.other_student", {
                      id: targetSubmission.userId,
                    })
                  : t("plagiarism.comparison.external_source")}
              </CardDescription>
            </CardHeader>
            <div className="flex-1 overflow-hidden relative">
              <CodeEditor
                initialCode={targetSubmission.code}
                language={targetSubmission.language || "javascript"}
                readOnly={true}
                showSubmitButton={false}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Notas del profesor */}
      <Card className="shrink-0">
        <CardContent className="pt-4">
          <label className="text-sm font-medium mb-2 block">
            {t("plagiarism.comparison.review_notes")}
          </label>
          <Textarea
            placeholder={t("plagiarism.comparison.notes_placeholder")}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="h-20 resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
