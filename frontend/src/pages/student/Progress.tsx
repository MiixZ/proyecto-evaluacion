import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { studentService } from "@/services/student.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data/table";
import { Input } from "@/components/ui/forms/input";
import { Badge } from "@/components/ui/data/badge";
import { Button } from "@/components/ui/forms/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";

export default function StudentProgressPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentProgress"],
    queryFn: studentService.getProgress,
  });

  const filteredData =
    progressData?.filter(
      (item) =>
        item.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusBadge = (item: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`exercise.difficulty.${diff}` as any) || diff;
  };

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

      <div className="flex items-center py-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("progress_page.search_placeholder")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("progress_page.table.exercise")}</TableHead>
              <TableHead>{t("progress_page.table.subject")}</TableHead>
              <TableHead>{t("progress_page.table.difficulty")}</TableHead>
              <TableHead>{t("progress_page.table.status")}</TableHead>
              <TableHead className="text-center">
                {t("progress_page.table.attempts")}
              </TableHead>
              <TableHead className="text-right">
                {t("progress_page.table.score")}
              </TableHead>
              <TableHead className="text-right">
                {t("progress_page.table.last_attempt")}
              </TableHead>
              <TableHead className="text-right">
                {t("progress_page.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.exerciseId}>
                  <TableCell className="font-medium">
                    {item.exerciseTitle}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.subjectName}
                  </TableCell>
                  <TableCell className={getDifficultyColor(item.difficulty)}>
                    {getDifficultyLabel(item.difficulty)}
                  </TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell className="text-center">{item.attempts}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {item.attempts > 0 ? item.bestScore : "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {item.lastAttempt
                      ? new Date(item.lastAttempt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to={`/dashboard/exercise/${item.exerciseId}?courseId=${item.courseId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t("progress_page.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
