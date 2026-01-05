/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Code,
  FileText,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/data/badge";
import { Separator } from "@/components/ui/layout/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/layout/accordion";
import { academicService } from "@/services/academic.service";

export default function CourseDetail() {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: courseData, isLoading } = useQuery({
    queryKey: ["courseDetail", courseId],
    queryFn: () => academicService.getMigrationPreview(courseId!),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {t("admin.courses.detail.notFound")}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const { course, summary, syllabi } = courseData;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {t("admin.courses.detail.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.courses.detail.subtitle")}
          </p>
        </div>
      </div>

      {/* Información del curso */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.courses.detail.courseInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.courses.detail.academicYear")}
                </p>
                <p className="font-semibold">{course.academicYear}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.courses.detail.semester")}
                </p>
                <p className="font-semibold">
                  {t("admin.courses.migration.semesterLabel", {
                    number: course.semester,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.courses.detail.syllabi")}
                </p>
                <p className="font-semibold text-2xl">{summary.totalSyllabi}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.courses.detail.exercises")}
                </p>
                <p className="font-semibold text-2xl">
                  {summary.totalExercises}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listado de syllabi y ejercicios */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.courses.detail.content")}</CardTitle>
          <CardDescription>
            {t("admin.courses.detail.contentDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syllabi.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.courses.detail.noContent")}</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {syllabi.map((syllabus: any, index: number) => (
                <AccordionItem key={syllabus.id} value={syllabus.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{syllabus.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {syllabus.exercises_count}{" "}
                          {t("admin.courses.detail.exercisesCount")}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {syllabus.content_type || "Module"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4 pl-11">
                      {syllabus.description && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">
                            {t("admin.courses.detail.description")}:
                          </p>
                          <p>{syllabus.description}</p>
                        </div>
                      )}

                      {syllabus.exercises && syllabus.exercises.length > 0 ? (
                        <div>
                          <p className="font-medium text-sm mb-3">
                            {t("admin.courses.detail.exercisesList")}:
                          </p>
                          <div className="space-y-3">
                            {syllabus.exercises.map((exercise: any) => (
                              <div
                                key={exercise.id}
                                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group">
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Code className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="font-semibold text-sm">
                                        {exercise.title}
                                      </p>
                                      {exercise.is_published ? (
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant={
                                          exercise.difficulty === "beginner"
                                            ? "default"
                                            : exercise.difficulty ===
                                              "intermediate"
                                            ? "secondary"
                                            : "destructive"
                                        }>
                                        {t(
                                          `exercise.difficulty.${exercise.difficulty}`
                                        )}
                                      </Badge>
                                      <Badge variant="outline">
                                        {exercise.language}
                                      </Badge>
                                      {exercise.points && (
                                        <Badge
                                          variant="outline"
                                          className="flex items-center gap-1">
                                          <Award className="h-3 w-3" />
                                          {exercise.points} pts
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("admin.courses.detail.noExercises")}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
