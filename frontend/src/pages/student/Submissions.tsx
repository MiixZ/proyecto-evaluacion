import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
} from "lucide-react";
import { studentService } from "@/services/student.service";
import { Badge } from "@/components/ui/data/badge";
import { Button } from "@/components/ui/forms/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { DataTable, ColumnDef } from "@/components/ui/data/data-table";

interface Submission {
  id: string;
  createdAt: string;
  exerciseTitle: string;
  subjectName: string;
  language: string;
  verdict: string;
  score: number;
  exerciseId: string;
  courseId: string;
  [key: string]: any;
}

export default function StudentSubmissionsPage() {
  const { t, i18n } = useTranslation();

  const {
    data: submissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allSubmissions"],
    queryFn: studentService.getAllSubmissions,
  });

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "accepted":
        return (
          <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.${verdict}`) || verdict}
          </Badge>
        );
      case "compilation_error":
      case "runtime_error":
      case "time_limit":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.${verdict}`) || verdict}
          </Badge>
        );
      case "hardcoded_solution":
        return (
          <Badge className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border-orange-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.${verdict}`) || verdict}
          </Badge>
        );
      case "pending":
      case "running":
        return (
          <Badge variant="outline" className="animate-pulse">
            <Clock className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.pending`)}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.${verdict}`) || verdict}
          </Badge>
        );
    }
  };
  const columns: ColumnDef<Submission>[] = [
    {
      key: "createdAt",
      label: t("submissions_page.table.date"),
      sortable: true,
      render: (item) =>
        format(new Date(item.createdAt), "dd MMM HH:mm", {
          locale: i18n.language === "es" ? es : enUS,
        }),
      className: "text-muted-foreground text-sm whitespace-nowrap",
    },
    {
      key: "exerciseTitle",
      label: t("submissions_page.table.exercise"),
      sortable: true,
      className: "font-medium text-foreground",
    },
    {
      key: "subjectName",
      label: t("submissions_page.table.subject"),
      sortable: true,
      className: "text-muted-foreground",
    },
    {
      key: "language",
      label: t("submissions_page.table.language"),
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">
          {item.language}
        </span>
      ),
      headerClassName: "text-center",
      className: "text-center",
    },
    {
      key: "verdict",
      label: t("submissions_page.table.verdict"),
      sortable: true,
      render: (item) => getVerdictBadge(item.verdict),
    },
    {
      key: "score",
      label: t("submissions_page.table.score"),
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium">{item.score}</span>
      ),
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "actions",
      label: t("submissions_page.table.actions"),
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/dashboard/exercise/${item.exerciseId}?courseId=${item.courseId}&submissionId=${item.id}&tab=history`}>
            {t("submissions_page.actions.view")}
            <Eye className="ml-2 h-3 w-3" />
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
          {t("submissions_page.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("submissions_page.subtitle")}
        </p>
      </div>

      <DataTable<Submission>
        data={submissions}
        columns={columns}
        searchKeys={["exerciseTitle", "subjectName", "language"]}
        filterOptions={[
          {
            key: "verdict",
            label: t("submissions_page.filter_placeholder"),
            options: [
              {
                value: "accepted",
                label: t("submissions_page.filter.accepted"),
              },
              {
                value: "wrong_answer",
                label: t("submissions_page.filter.wrong_answer"),
              },
              {
                value: "compilation_error",
                label: t("submissions_page.filter.compilation_error"),
              },
            ],
          },
        ]}
        getRowKey={(item) => item.id}
        searchPlaceholder={t("submissions_page.search_placeholder")}
        emptyMessage={t("submissions_page.empty")}
        isLoading={isLoading}
        pageSize={10}
      />
    </div>
  );
}
