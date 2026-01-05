import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, BookOpen, FilterX, FolderOpen } from "lucide-react";
import { studentService } from "@/services/student.service";
import {
  ExerciseCard,
  ExerciseDifficulty,
  ExerciseStatus,
} from "@/components/ui/data/exercise-card";
import { Input } from "@/components/ui/forms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { Button } from "@/components/ui/forms/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/layout/accordion";
import { Badge } from "@/components/ui/data/badge";
import { StudentDashboardProgress } from "@/types/dashboard.types";

export default function StudentExercises() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSubject = searchParams.get("subject") || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] =
    useState<string>(initialSubject);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentProgress"],
    queryFn: studentService.getProgress,
  });

  useEffect(() => {
    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [searchParams]);

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    if (value === "all") {
      searchParams.delete("subject");
    } else {
      searchParams.set("subject", value);
    }
    setSearchParams(searchParams);
  };

  const subjects = useMemo(() => {
    if (!progressData) return [];
    const uniqueSubjects = new Set(progressData.map((p) => p.subjectName));
    return Array.from(uniqueSubjects).sort();
  }, [progressData]);

  const filteredExercises = useMemo(() => {
    if (!progressData) return [];

    return progressData.filter((ex) => {
      const matchesSearch = ex.exerciseTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSubject =
        selectedSubject === "all" || ex.subjectName === selectedSubject;
      const matchesDifficulty =
        selectedDifficulty === "all" || ex.difficulty === selectedDifficulty;

      let status = "pending";
      if (ex.isCompleted) status = "completed";
      else if (ex.attempts > 0) status = "failed";

      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      return (
        matchesSearch && matchesSubject && matchesDifficulty && matchesStatus
      );
    });
  }, [
    progressData,
    searchTerm,
    selectedSubject,
    selectedDifficulty,
    selectedStatus,
  ]);

  const groupedExercises = useMemo(() => {
    const groups: Record<
      string,
      Record<string, StudentDashboardProgress[]>
    > = {};

    filteredExercises.forEach((ex) => {
      const subject = ex.subjectName;
      const syllabus = ex.syllabusTitle || "General";

      if (!groups[subject]) {
        groups[subject] = {};
      }
      if (!groups[subject][syllabus]) {
        groups[subject][syllabus] = [];
      }

      groups[subject][syllabus].push(ex);
    });

    return groups;
  }, [filteredExercises]);

  const mapDifficulty = (diff: string): ExerciseDifficulty => {
    const map: Record<string, ExerciseDifficulty> = {
      beginner: "easy",
      intermediate: "medium",
      advanced: "hard",
    };
    return map[diff] || "medium";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatus = (ex: any): ExerciseStatus => {
    if (ex.isCompleted) return "completed";
    if (ex.attempts > 0 && !ex.isCompleted) return "failed";
    return "pending";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedDifficulty("all");
    setSelectedStatus("all");
    setSearchParams({});
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

  const sortedSubjects = Object.keys(groupedExercises).sort();

  return (
    <div className="space-y-6 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("exercises_page.title")}
        </h1>
        <p className="text-muted-foreground">{t("exercises_page.subtitle")}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("exercises_page.search_placeholder")}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Select value={selectedSubject} onValueChange={handleSubjectChange}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder={t("exercises_page.filters.subject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("exercises_page.filters.all_subjects")}
            </SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDifficulty}
          onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("exercises_page.filters.difficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("exercises_page.filters.all_difficulties")}
            </SelectItem>
            <SelectItem value="beginner">
              {t("exercise.difficulty.beginner")}
            </SelectItem>
            <SelectItem value="intermediate">
              {t("exercise.difficulty.intermediate")}
            </SelectItem>
            <SelectItem value="advanced">
              {t("exercise.difficulty.advanced")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("exercises_page.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("exercises_page.filters.all_statuses")}
            </SelectItem>
            <SelectItem value="pending">
              {t("exercises_page.status.pending")}
            </SelectItem>
            <SelectItem value="completed">
              {t("exercises_page.status.completed")}
            </SelectItem>
            <SelectItem value="failed">
              {t("exercises_page.status.failed")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t("exercises_page.exercises_found", {
              count: filteredExercises.length,
            })}
          </h2>
        </div>

        {filteredExercises.length > 0 ? (
          <div className="space-y-6">
            <Accordion
              type="multiple"
              className="w-full space-y-4"
              defaultValue={
                selectedSubject !== "all" ? [selectedSubject] : sortedSubjects
              }>
              {sortedSubjects.map((subjectName) => (
                <AccordionItem
                  key={subjectName}
                  value={subjectName}
                  className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-foreground">
                        {subjectName}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {Object.values(groupedExercises[subjectName]).reduce(
                          (acc, curr) => acc + curr.length,
                          0
                        )}{" "}
                        ejercicios
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-6 space-y-8">
                    {Object.entries(groupedExercises[subjectName]).map(
                      ([syllabusName, exercises]) => (
                        <div key={syllabusName} className="space-y-3">
                          <div className="flex items-center gap-2 pl-2 border-l-4 border-primary/20">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-base text-muted-foreground uppercase tracking-wide">
                              {syllabusName}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                            {exercises.map((ex) => (
                              <ExerciseCard
                                key={ex.exerciseId}
                                id={ex.exerciseId}
                                courseId={ex.courseId}
                                title={ex.exerciseTitle}
                                description={ex.difficulty.toUpperCase()}
                                difficulty={mapDifficulty(ex.difficulty)}
                                status={getStatus(ex)}
                                attempts={ex.attempts}
                                dueDate={
                                  ex.deadline
                                    ? new Date(ex.deadline).toLocaleDateString()
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <FilterX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("exercises_page.empty")}</h3>
            <Button variant="link" onClick={resetFilters} className="mt-2">
              {t("exercises_page.reset_filters")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
