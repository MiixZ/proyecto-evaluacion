import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lock, Unlock, HelpCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/layout/accordion";
import { exerciseService } from "@/services/exercise.service";
import { SubmissionResponse } from "@/types/exercise.types";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface HintPanelProps {
  lastSubmission: SubmissionResponse | null;
}

export const HintPanel = ({ lastSubmission }: HintPanelProps) => {
  const { t } = useTranslation();

  const [revealedHints, setRevealedHints] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (lastSubmission?.testResults) {
      const hintsFromBackend: Record<string, string> = {};
      lastSubmission.testResults.forEach((result) => {
        if (result.hintText) {
          hintsFromBackend[result.testCaseId] = result.hintText;
        }
      });
      setRevealedHints(hintsFromBackend);
    } else {
      setRevealedHints({});
    }
  }, [lastSubmission]);

  const hintMutation = useMutation({
    mutationFn: (vars: { submissionId: string; testCaseId: string }) =>
      exerciseService.requestHint(vars.submissionId, vars.testCaseId),
    onSuccess: (data, vars) => {
      setRevealedHints((prev) => ({
        ...prev,
        [vars.testCaseId]: data.hintText,
      }));
      toast.success(t("exercise.hints.success_unlocked"));
    },
    onError: () => {
      toast.error(t("exercise.hints.error_locking"));
    },
  });

  const handleRequestHint = (testCaseId: string) => {
    if (!lastSubmission) return;
    hintMutation.mutate({ submissionId: lastSubmission.id, testCaseId });
  };

  if (!lastSubmission) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
        <HelpCircle className="h-10 w-10 mb-3 opacity-20" />
        <p className="max-w-xs text-sm">
          {t("exercise.hints.no_last_submission")}
        </p>
        <p className="max-w-xs text-xs mt-2 opacity-70">
          {t("exercise.hints.empty_state")}
        </p>
      </div>
    );
  }

  const failedTests = lastSubmission.testResults.filter(
    (tr) => tr.status !== "passed"
  );

  if (failedTests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-green-600/80">
        <Unlock className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">{t("exercise.hints.all_passed")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <HelpCircle className="h-4 w-4" />
        {t("exercise.hints.title")}
      </h3>

      <Accordion type="single" collapsible className="w-full">
        {failedTests.map((test, index) => {
          const isRevealed = !!revealedHints[test.testCaseId];

          return (
            <AccordionItem key={test.id} value={test.id}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  {isRevealed ? (
                    <Unlock className="h-3 w-3 text-green-500" />
                  ) : (
                    <Lock className="h-3 w-3 text-orange-500" />
                  )}
                  {t("exercise.hints.test_case", { number: index + 1 })}
                  <span className="ml-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {t("exercise.hints.status_failed")}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 px-1">
                {isRevealed ? (
                  <div className="p-3 bg-muted/50 rounded-md border border-l-4 border-l-green-500 text-sm italic">
                    "{revealedHints[test.testCaseId]}"
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-md border border-dashed">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                      {t("exercise.hints.penalty_warning", { penalty: 10 })}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRequestHint(test.testCaseId)}
                      disabled={hintMutation.isPending}
                      className="w-full sm:w-auto self-end">
                      {hintMutation.isPending
                        ? "..."
                        : t("exercise.hints.request_btn")}
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
