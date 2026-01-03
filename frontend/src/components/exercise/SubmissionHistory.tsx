import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { SubmissionHistoryItem } from "@/types/exercise.types";
import { cn } from "@/lib/utils";

interface SubmissionHistoryProps {
  history: SubmissionHistoryItem[];
}

export const SubmissionHistory = ({ history }: SubmissionHistoryProps) => {
  const { t } = useTranslation();

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2 opacity-50" />
        <p>{t("exercise.history.empty")}</p>
      </div>
    );
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "compilation_error":
      case "runtime_error":
      case "time_limit":
      case "memory_limit":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <ScrollArea className="h-[400px] w-full pr-4">
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getVerdictIcon(item.verdict)}</div>
              <div>
                <p className="text-sm font-medium capitalize">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`exercise.history.verdict.${item.verdict}` as any) ||
                    item.verdict}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.createdAt), "PP p", { locale: es })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "text-sm font-bold",
                  item.score >= 10 ? "text-green-500" : ""
                )}>
                {t("exercise.history.score")}: {item.score}
              </div>
              {item.executionTimeMs !== undefined &&
                item.executionTimeMs > 0 && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {item.executionTimeMs} {t("exercise.history.time_suffix")}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
