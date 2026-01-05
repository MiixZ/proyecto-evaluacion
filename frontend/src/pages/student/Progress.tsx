import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { studentService } from "@/services/student.service";
import { Badge } from "@/components/ui/data/badge";
import { Button } from "@/components/ui/forms/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";

interface ProgressItem {
  exerciseId: number;
  exerciseTitle: string;
  subjectName: string;
  difficulty: string;
  isCompleted: boolean;
  attempts: number;
  bestScore: number;
  lastAttempt: string | null;
  courseId: number;
}

export default function StudentProgressPage() {
  const { t } = useTranslation();

  const {
    data: progressData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentProgress"],
    queryFn: studentService.getProgress,
  });

  const getStatusBadge = (item: ProgressItem) => {
    if (item.isCompleted) {
      return (
        <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {t("progress_page.status.completed")}
        </Badge>
      );
    }
    if (item.attempts > 0) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          {t("progress_page.status.failed")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="mr-1 h-3 w-3" />
        {t("progress_page.status.pending")}
      </Badge>
    );
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "beginner":
        return "text-green-500";
      case "intermediate":
        return "text-yellow-500";
      case "advanced":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getDifficultyLabel = (diff: string) => {
    return t(`exercise.difficulty.${diff}`) || diff;
  };

  const columns: ColumnDef<ProgressItem>[] = [
    {
      key: "exerciseTitle",
      label: t("progress_page.table.exercise"),
      sortable: true,
      className: "font-medium",
    },
    {
      key: "subjectName",
      label: t("progress_page.table.subject"),
      sortable: true,
      className: "text-muted-foreground",
    },
    {
      key: "difficulty",
      label: t("progress_page.table.difficulty"),
      sortable: true,
      render: (item) => (
        <span className={getDifficultyColor(item.difficulty)}>
          {getDifficultyLabel(item.difficulty)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("progress_page.table.status"),
      sortable: true,
      render: (item) => getStatusBadge(item),
    },
    {
      key: "attempts",
      label: t("progress_page.table.attempts"),
      sortable: true,
      headerClassName: "text-center",
      className: "text-center",
    },
    {
      key: "bestScore",
      label: t("progress_page.table.score"),
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium">
          {item.attempts > 0 ? item.bestScore : "-"}
        </span>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "lastAttempt",
      label: t("progress_page.table.last_attempt"),
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground text-sm">
          {item.lastAttempt
            ? new Date(item.lastAttempt).toLocaleDateString()
            : "-"}
        </span>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "actions",
      label: t("progress_page.table.actions"),
      render: (item) => (
        <Button variant="ghost" size="icon" asChild>
          <Link
            to={`/dashboard/exercise/${item.exerciseId}?courseId=${item.courseId}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>{t("exercise.status.error_title")}</AlertTitle>
          <AlertDescription>{t("exercise.status.error_desc")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("progress_page.title")}
        </h1>
        <p className="text-muted-foreground">{t("progress_page.subtitle")}</p>
      </div>

      <DataTable<ProgressItem>
        data={progressData}
        columns={columns}
        searchKeys={["exerciseTitle", "subjectName"]}
        filterOptions={[
          {
            key: "difficulty",
            label: t("progress_page.filter_difficulty"),
            options: [
              { value: "beginner", label: t("exercise.difficulty.beginner") },
              {
                value: "intermediate",
                label: t("exercise.difficulty.intermediate"),
              },
              { value: "advanced", label: t("exercise.difficulty.advanced") },
            ],
          },
        ]}
        getRowKey={(item) => item.exerciseId}
        searchPlaceholder={t("progress_page.search_placeholder")}
        emptyMessage={t("progress_page.empty")}
        isLoading={isLoading}
        pageSize={10}
      />
    </div>
  );
}
