import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Loader2, ArrowRight } from "lucide-react";
import { studentService } from "@/services/student.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/layout/card";
import { Progress } from "@/components/ui/feedback/progress";
import { Button } from "@/components/ui/forms/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { Badge } from "@/components/ui/data/badge";

export default function StudentSubjects() {
  const { t } = useTranslation();

  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentProgress"],
    queryFn: studentService.getProgress,
  });

  const subjects = progressData?.reduce((acc, curr) => {
    if (!acc[curr.subjectName]) {
      acc[curr.subjectName] = {
        courseId: curr.courseId,
        name: curr.subjectName,
        academicYear: curr.academicYear,
        totalExercises: 0,
        completedExercises: 0,
        totalScore: 0,
        attemptsCount: 0,
      };
    }

    acc[curr.subjectName].totalExercises += 1;
    if (curr.isCompleted) {
      acc[curr.subjectName].completedExercises += 1;
      acc[curr.subjectName].totalScore += curr.bestScore;
      acc[curr.subjectName].attemptsCount += 1;
    }

    return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>);

  const subjectList = Object.values(subjects || {});

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
          {t("subjects_page.title")}
        </h1>
        <p className="text-muted-foreground">{t("subjects_page.subtitle")}</p>
      </div>

      {subjectList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectList.map((subject) => {
            const progress = Math.round(
              (subject.completedExercises / subject.totalExercises) * 100
            );
            const avgScore =
              subject.attemptsCount > 0
                ? (subject.totalScore / subject.attemptsCount).toFixed(1)
                : "0.0";

            return (
              <Card
                key={subject.name}
                className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">
                      {t("subjects_page.card.year", {
                        year: subject.academicYear,
                      })}
                    </Badge>
                  </div>
                  <CardTitle
                    className="mt-4 text-xl line-clamp-1"
                    title={subject.name}>
                    {subject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 flex-1">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("subjects_page.stats.progress")}
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {t("subjects_page.stats.completed")}
                        </p>
                        <p className="text-lg font-bold">
                          {subject.completedExercises}/{subject.totalExercises}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {t("subjects_page.stats.score")}
                        </p>
                        <p className="text-lg font-bold">{avgScore}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button className="w-full" variant="outline" asChild>
                    <Link
                      to={`/dashboard/exercises?subject=${encodeURIComponent(
                        subject.name
                      )}`}>
                      {t("subjects_page.view_exercises")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/10">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t("subjects_page.empty")}</h3>
        </div>
      )}
    </div>
  );
}
