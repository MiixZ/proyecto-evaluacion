/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/forms/button";
import { Form } from "@/components/ui/forms/form";
import { toast } from "@/hooks/use-toast";

import { syllabusService } from "@/services/syllabus.service";
import {
  exerciseService,
  CreateExercisePayload,
} from "@/services/exercise.service";
import { dashboardService } from "@/services/dashboard.service";
import { languageService } from "@/services/language.service";

import {
  getCreateExerciseSchema,
  CreateExerciseFormValues,
} from "@/schemas/exercise.schema";
import {
  parseBackendError,
  applyValidationErrors,
  extractValidationErrors,
} from "@/lib/error-handler";

import { BasicInfoSection } from "@/components/exercise/BasicInfoSection";
import { TestCasesSection } from "@/components/exercise/TestCasesSection";
import { TemplateSection } from "@/components/exercise/TemplateSection";
import { ConfigSection } from "@/components/exercise/ConfigSection";

export default function CreateExercise() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const isEditMode = !!exerciseId;

  const initialGroupId = localStorage.getItem("professorLastGroupId");

  // Estado para el grupo seleccionado (no está en el formulario)
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>(
    initialGroupId || ""
  );

  const exerciseSchema = getCreateExerciseSchema(t);

  const form = useForm<CreateExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      syllabusId: "",
      title: "",
      description: "",
      difficulty: "beginner",
      language: "python",
      templateCode: "",
      points: 10,
      maxAttempts: 10,
      deadline: "",
      lateSubmissionPenaltyPercent: 0,
      testCases: [
        {
          input: "",
          expectedOutput: "",
          isHidden: false,
          timeLimitSeconds: 2,
          memoryLimitMb: 128,
          hintText: "",
          hintPenaltyPercent: 0,
        },
      ],
    },
  });

  const { data: exerciseData, isLoading: isLoadingExercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => exerciseService.getById(exerciseId!),
    enabled: isEditMode,
  });

  const { data: dashboardData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["professorStats"],
    queryFn: () => dashboardService.getProfessorStats(),
  });

  const { data: availableLanguages = [], isLoading: isLoadingLanguages } =
    useQuery({
      queryKey: ["languages"],
      queryFn: languageService.getActiveLanguages,
      staleTime: 1000 * 60 * 60,
    });

  const groups = useMemo(
    () => dashboardData?.groups || [],
    [dashboardData?.groups]
  );
  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId);

  const { data: syllabi, isLoading: isLoadingSyllabi } = useQuery({
    queryKey: ["syllabi", selectedGroup?.courseId],
    queryFn: () => syllabusService.getByCourse(selectedGroup!.courseId),
    enabled: !!selectedGroup?.courseId,
  });

  // Cargar datos del ejercicio en modo edición
  useEffect(() => {
    if (exerciseData && groups.length > 0) {
      form.reset({
        syllabusId: exerciseData.syllabusId,
        title: exerciseData.title,
        description: exerciseData.description,
        difficulty: exerciseData.difficulty,
        language: exerciseData.language,
        templateCode: exerciseData.templateCode || "",
        points: exerciseData.points,
        maxAttempts: exerciseData.maxAttempts,
        deadline: exerciseData.deadline
          ? new Date(exerciseData.deadline).toISOString().slice(0, 16)
          : "",
        lateSubmissionPenaltyPercent: exerciseData.lateSubmissionPenaltyPercent,
        testCases:
          exerciseData.testCases && exerciseData.testCases.length > 0
            ? exerciseData.testCases.map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                timeLimitSeconds: tc.timeLimitSeconds || 2,
                memoryLimitMb: tc.memoryLimitMb || 128,
                hintText: tc.hintText || "",
                hintPenaltyPercent: tc.hintPenaltyPercent || 0,
              }))
            : [
                {
                  input: "",
                  expectedOutput: "",
                  isHidden: false,
                  timeLimitSeconds: 2,
                  memoryLimitMb: 128,
                  hintText: "",
                  hintPenaltyPercent: 0,
                },
              ],
      });

      const matchedGroup = groups.find(
        (g) => g.courseId === exerciseData.courseId
      );
      if (matchedGroup) {
        setSelectedGroupId(matchedGroup.groupId);
      }
    }
  }, [exerciseData, groups, form]);

  // Resetear temario cuando cambia el grupo
  useEffect(() => {
    form.setValue("syllabusId", "");
  }, [selectedGroupId, form]);

  // Seleccionar primer grupo si no hay selección
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].groupId);
    }
  }, [groups, selectedGroupId]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreateExercisePayload) => {
      if (isEditMode) {
        return exerciseService.update(exerciseId!, payload);
      }
      return exerciseService.create(payload);
    },
    onSuccess: () => {
      toast({
        title: isEditMode
          ? t("professor.create_exercise.success_updated")
          : t("professor.create_exercise.success_created"),
        description: t("professor.create_exercise.success_desc"),
      });
      navigate("/dashboard/manage-exercises");
    },
    onError: (error: any) => {
      const errorMessage = parseBackendError(
        error,
        t("professor.create_exercise.error_desc")
      );
      const validationErrors = extractValidationErrors(error);

      if (validationErrors) {
        applyValidationErrors(validationErrors, form.setError);
      }

      toast({
        title: t("professor.create_exercise.error_title"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateExerciseFormValues) => {
    if (!selectedGroup) {
      toast({
        title: t("professor.create_exercise.missing_info_title"),
        description: t("professor.create_exercise.missing_syllabus"),
        variant: "destructive",
      });
      return;
    }

    if (!values.syllabusId) {
      toast({
        title: t("professor.create_exercise.missing_info_title"),
        description: t("professor.create_exercise.missing_syllabus"),
        variant: "destructive",
      });
      return;
    }

    const payload: CreateExercisePayload = {
      syllabusId: values.syllabusId,
      title: values.title,
      description: values.description,
      difficulty: values.difficulty,
      language: values.language,
      templateCode: values.templateCode,
      points: values.points,
      maxAttempts: values.maxAttempts,
      deadline: values.deadline,
      lateSubmissionPenaltyPercent: values.lateSubmissionPenaltyPercent,
      testCases: values.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        timeLimitSeconds: tc.timeLimitSeconds,
        memoryLimitMb: tc.memoryLimitMb,
        hintText: tc.hintText,
        hintPenaltyPercent: tc.hintPenaltyPercent,
      })),
    };

    saveMutation.mutate(payload);
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    localStorage.setItem("professorLastGroupId", groupId);
  };

  if (isLoadingExercise || isLoadingGroups) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode
              ? t("professor.create_exercise.title_edit")
              : t("professor.create_exercise.title_create")}
          </h1>
          <p className="text-muted-foreground">
            {t("professor.create_exercise.subtitle")}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <BasicInfoSection
            form={form}
            groups={groups}
            syllabi={syllabi}
            selectedGroupId={selectedGroupId}
            onGroupChange={handleGroupChange}
            isLoadingSyllabi={isLoadingSyllabi}
          />

          {/* Plantilla de Código */}
          <TemplateSection
            form={form}
            availableLanguages={availableLanguages}
            isLoadingLanguages={isLoadingLanguages}
          />

          {/* Casos de Prueba */}
          <TestCasesSection form={form} />

          {/* Configuración */}
          <ConfigSection form={form} />

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/manage-exercises")}>
              {t("professor.create_exercise.cancel")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("professor.create_exercise.submitting")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("professor.create_exercise.save")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
