/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  FileText,
  Code,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";
import { Button } from "@/components/ui/forms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Label } from "@/components/ui/forms/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/feedback/alert";
import { Separator } from "@/components/ui/layout/separator";
import { Card, CardContent } from "@/components/ui/layout/card";
import { academicService } from "@/services/academic.service";
import { toast } from "sonner";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCourseId: string;
  availableCourses: any[];
  onSuccess: () => void;
}

export function MigrationDialog({
  open,
  onOpenChange,
  sourceCourseId,
  availableCourses,
  onSuccess,
}: MigrationDialogProps) {
  const { t } = useTranslation();
  const [targetCourseId, setTargetCourseId] = useState("");
  const [includeSyllabi, setIncludeSyllabi] = useState(true);
  const [includeExercises, setIncludeExercises] = useState(true);
  const [selectedSyllabi, setSelectedSyllabi] = useState<string[]>([]);
  const [selectAllSyllabi, setSelectAllSyllabi] = useState(true);

  // Obtener preview de migración
  const {
    data: preview,
    isLoading: loadingPreview,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["migrationPreview", sourceCourseId],
    queryFn: () => academicService.getMigrationPreview(sourceCourseId),
    enabled: open && !!sourceCourseId,
  });

  // Reset cuando abre el modal
  useEffect(() => {
    if (open) {
      setTargetCourseId("");
      setIncludeSyllabi(true);
      setIncludeExercises(true);
      setSelectAllSyllabi(true);
      setSelectedSyllabi([]);
      if (sourceCourseId) {
        refetchPreview();
      }
    }
  }, [open, sourceCourseId, refetchPreview]);

  // Actualizar selectedSyllabi cuando cambia preview o selectAllSyllabi
  useEffect(() => {
    if (preview?.syllabi && selectAllSyllabi) {
      setSelectedSyllabi(preview.syllabi.map((s: any) => s.id));
    } else if (!selectAllSyllabi) {
      setSelectedSyllabi([]);
    }
  }, [preview, selectAllSyllabi]);

  // Mutación de migración
  const migrateMutation = useMutation({
    mutationFn: (data: {
      targetCourseId: string;
      includeSyllabi: boolean;
      includeExercises: boolean;
      selectedSyllabiIds?: string[];
    }) => academicService.migrateContent(sourceCourseId, data),
    onSuccess: (data) => {
      toast.success(
        t("admin.courses.migration.successMessage", {
          syllabi: data.summary.syllabi,
          exercises: data.summary.exercises,
        })
      );
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          t("admin.courses.migration.error")
      );
    },
  });

  const handleMigrate = () => {
    if (!targetCourseId) {
      toast.error(t("admin.courses.migration.selectTargetCourse"));
      return;
    }

    migrateMutation.mutate({
      targetCourseId,
      includeSyllabi,
      includeExercises,
      selectedSyllabiIds: selectAllSyllabi ? undefined : selectedSyllabi,
    });
  };

  const toggleSyllabusSelection = (syllabusId: string) => {
    setSelectedSyllabi((prev) =>
      prev.includes(syllabusId)
        ? prev.filter((id) => id !== syllabusId)
        : [...prev, syllabusId]
    );
    setSelectAllSyllabi(false);
  };

  // Filtrar cursos disponibles (excluir el curso origen)
  const targetCourses = availableCourses.filter((c) => c.id !== sourceCourseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            {t("admin.courses.migration.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.courses.migration.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Curso origen info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {t("admin.courses.migration.sourceCourse")}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  <p>
                    <strong>
                      {t("admin.courses.migration.academicYear")}:
                    </strong>{" "}
                    {preview?.course.academicYear}
                  </p>
                  <p>
                    <strong>{t("admin.courses.migration.semester")}:</strong>{" "}
                    {t("admin.courses.migration.semesterLabel", {
                      number: preview?.course.semester,
                    })}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Resumen de contenido */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {preview?.summary.totalSyllabi || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.courses.migration.syllabi")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {preview?.summary.totalExercises || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.courses.migration.exercises")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selección de curso destino */}
            <div className="space-y-2">
              <Label htmlFor="targetCourse">
                {t("admin.courses.migration.selectTargetCourse")}
              </Label>
              <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                <SelectTrigger id="targetCourse">
                  <SelectValue
                    placeholder={t(
                      "admin.courses.migration.selectTargetCoursePlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {targetCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.academic_year} -{" "}
                      {t("admin.courses.migration.semesterLabel", {
                        number: course.semester,
                      })}{" "}
                      ({course.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Opciones de migración */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {t("admin.courses.migration.options")}
              </Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSyllabi"
                  checked={includeSyllabi}
                  onCheckedChange={setIncludeSyllabi as any}
                />
                <label
                  htmlFor="includeSyllabi"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("admin.courses.migration.includeSyllabi")}
                </label>
              </div>

              {includeSyllabi && (
                <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectAllSyllabi}
                      onCheckedChange={setSelectAllSyllabi as any}
                    />
                    <label htmlFor="selectAll" className="text-sm font-medium">
                      {t("admin.courses.migration.selectAllSyllabi")}
                    </label>
                  </div>

                  {!selectAllSyllabi && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {preview?.syllabi.map((syllabus: any) => (
                        <div
                          key={syllabus.id}
                          className="flex items-center space-x-2">
                          <Checkbox
                            id={syllabus.id}
                            checked={selectedSyllabi.includes(syllabus.id)}
                            onCheckedChange={() =>
                              toggleSyllabusSelection(syllabus.id)
                            }
                          />
                          <label htmlFor={syllabus.id} className="text-sm">
                            {syllabus.title} ({syllabus.exercises_count}{" "}
                            {t("admin.courses.migration.exercisesCount")})
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeExercises"
                  checked={includeExercises}
                  onCheckedChange={setIncludeExercises as any}
                  disabled={!includeSyllabi}
                />
                <label
                  htmlFor="includeExercises"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("admin.courses.migration.includeExercises")}
                </label>
              </div>

              {includeExercises && includeSyllabi && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {t("admin.courses.migration.exercisesNote")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={migrateMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={
              !targetCourseId || migrateMutation.isPending || loadingPreview
            }>
            {migrateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("admin.courses.migration.migrating")}
              </>
            ) : (
              <>
                <GitBranch className="mr-2 h-4 w-4" />
                {t("admin.courses.migration.startMigration")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
