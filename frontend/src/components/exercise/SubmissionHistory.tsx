import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  GitCompare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { Button } from "@/components/ui/forms/button";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { SubmissionHistoryItem } from "@/types/exercise.types";
import { cn } from "@/lib/utils";

interface SubmissionHistoryProps {
  history: SubmissionHistoryItem[];
  onSelectSubmission?: (submission: SubmissionHistoryItem) => void;
  exerciseId: string;
}

export const SubmissionHistory = ({
  history,
  onSelectSubmission,
  exerciseId,
}: SubmissionHistoryProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  const handleCompare = () => {
    if (selectedIds.length === 2) {
      const [id1, id2] = selectedIds;
      navigate(`/dashboard/compare/${exerciseId}?source=${id2}&target=${id1}`);
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-muted-foreground">
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b mb-2">
        <h3 className="font-semibold text-sm">Historial</h3>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length !== 2}
          onClick={handleCompare}
          title="Selecciona 2 envíos para comparar">
          <GitCompare className="h-4 w-4 mr-2" />
          Comparar
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3 pb-4">
          {history.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors",
                selectedIds.includes(item.id)
                  ? "border-primary bg-accent/10"
                  : ""
              )}>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(item.id, checked as boolean)
                }
                disabled={
                  !selectedIds.includes(item.id) && selectedIds.length >= 2
                }
              />

              <div
                className="flex-1 flex items-center justify-between cursor-pointer"
                onClick={() => onSelectSubmission?.(item)}>
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
                        {item.executionTimeMs}{" "}
                        {t("exercise.history.time_suffix")}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
