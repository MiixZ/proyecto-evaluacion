import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FilterX,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function StudentSubmissionsPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");

  const {
    data: submissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allSubmissions"],
    queryFn: studentService.getAllSubmissions,
  });

  // Filtrado en cliente
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.language.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVerdict =
      verdictFilter === "all" || sub.verdict === verdictFilter;

    return matchesSearch && matchesVerdict;
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
      case "pending":
      case "running":
        return (
          <Badge variant="outline" className="animate-pulse">
            <Clock className="mr-1 h-3 w-3" />
            {t(`submissions_page.verdict.pending`)}
          </Badge>
        );
      default: // wrong_answer y otros fallos
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

  const resetFilters = () => {
    setSearchTerm("");
    setVerdictFilter("all");
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
          {t("submissions_page.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("submissions_page.subtitle")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("submissions_page.search_placeholder")}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue
              placeholder={t("submissions_page.filter_placeholder")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("submissions_page.filter.all")}
            </SelectItem>
            <SelectItem value="accepted">
              {t("submissions_page.filter.accepted")}
            </SelectItem>
            <SelectItem value="wrong_answer">
              {t("submissions_page.filter.wrong_answer")}
            </SelectItem>
            <SelectItem value="compilation_error">
              {t("submissions_page.filter.compilation_error")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("submissions_page.table.date")}</TableHead>
              <TableHead>{t("submissions_page.table.exercise")}</TableHead>
              <TableHead>{t("submissions_page.table.subject")}</TableHead>
              <TableHead className="text-center">
                {t("submissions_page.table.language")}
              </TableHead>
              <TableHead>{t("submissions_page.table.verdict")}</TableHead>
              <TableHead className="text-right">
                {t("submissions_page.table.score")}
              </TableHead>
              <TableHead className="text-right">
                {t("submissions_page.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {format(new Date(item.createdAt), "dd MMM HH:mm", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.exerciseTitle}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.subjectName}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground uppercase">
                    {item.language}
                  </TableCell>
                  <TableCell>{getVerdictBadge(item.verdict)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {item.score}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/dashboard/exercise/${item.exerciseId}?courseId=${item.courseId}`}>
                        {t("submissions_page.actions.view")}
                        <Eye className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FilterX className="h-8 w-8 mb-2 opacity-50" />
                    <p>{t("submissions_page.empty")}</p>
                    <Button variant="link" onClick={resetFilters}>
                      {t("submissions_page.clear_filters")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
