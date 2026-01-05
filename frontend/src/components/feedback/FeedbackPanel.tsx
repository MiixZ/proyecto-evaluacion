import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/forms/button";
import { Textarea } from "@/components/ui/forms/textarea";
import { Input } from "@/components/ui/forms/input";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/data/badge";
import { Avatar, AvatarFallback } from "@/components/ui/data/avatar";
import { feedbackService } from "@/services/feedback.service";
import {
  CreateFeedbackInput,
  FeedbackVisibility,
} from "@/types/feedback.types";
import { useAuth } from "@/hooks/use-auth";

interface FeedbackPanelProps {
  submissionId: string;
  readOnly?: boolean;
}

export default function FeedbackPanel({
  submissionId,
  readOnly = false,
}: FeedbackPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [scoreAdjustment, setScoreAdjustment] = useState("0");
  const [visibility, setVisibility] = useState<FeedbackVisibility>(
    FeedbackVisibility.STUDENT
  );

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["feedback", submissionId],
    queryFn: () => feedbackService.getBySubmission(submissionId),
  });

  const createMutation = useMutation({
    mutationFn: (newFeedback: CreateFeedbackInput) =>
      feedbackService.create(newFeedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", submissionId] });

      queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });

      toast.success(t("feedback.success_added"));
      setContent("");
      setScoreAdjustment("0");
    },
    onError: () => {
      toast.error(t("feedback.error_adding"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", submissionId] });

      queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });

      toast.success(t("feedback.success_deleted"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createMutation.mutate({
      submissionId,
      content,
      isGeneral: true,
      scoreAdjustment: parseInt(scoreAdjustment) || 0,
      visibility,
    });
  };

  const getVisibilityLabel = (vis: FeedbackVisibility) => {
    switch (vis) {
      case FeedbackVisibility.PRIVATE:
        return t("feedback.visibility.private");
      case FeedbackVisibility.STUDENT:
        return t("feedback.visibility.student");
      case FeedbackVisibility.GROUP:
        return t("feedback.visibility.group");
      default:
        return vis;
    }
  };

  return (
    <div className="space-y-6">
      {/* LISTA DE FEEDBACK */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {t("feedback.history_title")}
        </h3>

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            {t("feedback.loading")}
          </p>
        )}

        {!isLoading && feedbacks.length === 0 && (
          <div className="text-center p-4 border rounded-lg border-dashed text-muted-foreground text-sm">
            {t("feedback.no_comments")}
          </div>
        )}

        <div className="space-y-4">
          {feedbacks.map((item) => (
            <Card key={item.id} className="bg-muted/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.createdAt), "PP p", { locale: es })}
                    </span>
                    {!readOnly && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {getVisibilityLabel(item.visibility)}
                      </Badge>
                    )}
                  </div>
                  {!readOnly &&
                    (user?.id === item.teacherId || user?.role === "admin") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                </div>

                <p className="text-sm whitespace-pre-wrap">{item.content}</p>

                {item.scoreAdjustment !== 0 && (
                  <div
                    className={`text-xs font-medium ${
                      item.scoreAdjustment > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    {t("feedback.score_adjustment")}:{" "}
                    {item.scoreAdjustment > 0 ? "+" : ""}
                    {item.scoreAdjustment} pts
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      {!readOnly && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              {t("feedback.add_feedback")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder={t("feedback.write_comment")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("feedback.visibility_label")}
                  </label>
                  <Select
                    value={visibility}
                    onValueChange={(val) =>
                      setVisibility(val as FeedbackVisibility)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FeedbackVisibility.STUDENT}>
                        {t("feedback.visibility.student")}
                      </SelectItem>
                      <SelectItem value={FeedbackVisibility.PRIVATE}>
                        {t("feedback.visibility.private")}
                      </SelectItem>
                      <SelectItem value={FeedbackVisibility.GROUP}>
                        {t("feedback.visibility.group")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[150px] space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("feedback.score_adjustment")}
                  </label>
                  <Input
                    type="number"
                    value={scoreAdjustment}
                    onChange={(e) => setScoreAdjustment(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || !content.trim()}>
                  {createMutation.isPending
                    ? t("common.loading")
                    : t("feedback.submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
