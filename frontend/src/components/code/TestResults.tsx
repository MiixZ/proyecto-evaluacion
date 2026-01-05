import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TestResult } from "@/types/exercise.types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/layout/collapsible";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { Badge } from "@/components/ui/data/badge";
import { useState } from "react";

interface TestResultsProps {
  testCases: TestResult[];
  isRunning?: boolean;
  verdict?: string;
}

export const TestResults = ({
  testCases,
  isRunning,
  verdict,
}: TestResultsProps) => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "error":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
        );
    }
  };

  if (isRunning) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 animate-pulse">
        <Terminal className="h-10 w-10 mb-4 opacity-50" />
        <p>{t("editor.submitting")}</p>
      </div>
    );
  }

  if (!testCases.length && !verdict) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Terminal className="h-10 w-10 mb-4 opacity-20" />
        <p>{t("editor.run_code_to_see_results")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm">{t("editor.test_results")}</h3>
        {verdict && (
          <Badge variant={verdict === "accepted" ? "default" : "destructive"}>
            {verdict === "accepted"
              ? t("editor.verdict.accepted")
              : t(`editor.verdict.${verdict}`)}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {testCases.map((test, index) => {
            const isOpen = openItems.includes(test.id);
            const hasDetails = test.input || test.expectedOutput;

            return (
              <Collapsible
                key={test.id}
                open={isOpen}
                onOpenChange={() => hasDetails && toggleItem(test.id)}
                className={cn(
                  "border rounded-lg transition-all duration-200",
                  getStatusColor(test.status)
                )}>
                <div className="flex items-center p-3 gap-3">
                  {getStatusIcon(test.status)}

                  <span className="flex-1 font-medium text-sm">
                    {t("editor.test_case")} #{index + 1}
                  </span>

                  <div className="flex items-center gap-3 text-xs opacity-70">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.executionTimeMs}
                      {t("editor.ms")}
                    </span>
                    {hasDetails && (
                      <CollapsibleTrigger asChild>
                        <button className="hover:bg-background/20 p-1 rounded">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 text-xs font-mono space-y-3 opacity-90">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {test.input && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground font-sans uppercase text-[10px] tracking-wider">
                            Entrada
                          </span>
                          <div className="bg-background/50 p-2 rounded border border-border/50 whitespace-pre-wrap">
                            {test.input}
                          </div>
                        </div>
                      )}

                      {test.expectedOutput && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground font-sans uppercase text-[10px] tracking-wider">
                            {t("editor.expected")}
                          </span>
                          <div className="bg-background/50 p-2 rounded border border-border/50 whitespace-pre-wrap">
                            {test.expectedOutput}
                          </div>
                        </div>
                      )}
                    </div>

                    {test.actualOutput && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-sans uppercase text-[10px] tracking-wider">
                          {t("editor.your_output")}
                        </span>
                        <div
                          className={cn(
                            "p-2 rounded border whitespace-pre-wrap",
                            test.status === "passed"
                              ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
                          )}>
                          {test.actualOutput}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
