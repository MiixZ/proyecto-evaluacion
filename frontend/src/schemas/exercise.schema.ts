import { z } from "zod";
import { TFunction } from "i18next";

/**
 * Schema para casos de prueba (test cases)
 */
export const getTestCaseSchema = (t: TFunction) => {
  return z.object({
    id: z.string().optional(),
    input: z.string(),
    expectedOutput: z
      .string()
      .min(
        1,
        t("professor.create_exercise.validation.expected_output_required"),
      ),
    runnerCode: z.string().optional(),
    isHidden: z.boolean().default(false),
    timeLimitSeconds: z.number().int().positive().min(1).max(60).default(2),
    memoryLimitMb: z.number().int().positive().min(64).max(1024).default(128),
    hintText: z.string().optional(),
    hintPenaltyPercent: z.number().int().min(0).max(100).default(0),
  });
};

/**
 * Schema completo para crear/editar ejercicios
 */
export const getCreateExerciseSchema = (t: TFunction) => {
  return z.object({
    syllabusId: z
      .string()
      .uuid(t("professor.create_exercise.validation.invalid_syllabus")),
    title: z
      .string()
      .min(5, t("professor.create_exercise.validation.title_min"))
      .max(255, t("professor.create_exercise.validation.title_max")),
    description: z
      .string()
      .min(20, t("professor.create_exercise.validation.description_min")),
    difficulty: z.enum(["beginner", "intermediate", "advanced"], {
      errorMap: () => ({
        message: t("professor.create_exercise.validation.invalid_difficulty"),
      }),
    }),
    language: z
      .string()
      .min(1, t("professor.create_exercise.validation.language_required")),
    templateCode: z.string().optional(),
    points: z.number().int().positive().min(1).max(1000).default(10),
    maxAttempts: z.number().int().positive().min(1).max(100).default(10),
    deadline: z.string().optional().nullable(),
    lateSubmissionPenaltyPercent: z.number().int().min(0).max(100).default(0),
    testCases: z
      .array(getTestCaseSchema(t))
      .min(1, t("professor.create_exercise.validation.at_least_one_test_case")),
  });
};

export type CreateExerciseFormValues = z.infer<
  ReturnType<typeof getCreateExerciseSchema>
>;
export type TestCaseFormValues = z.infer<ReturnType<typeof getTestCaseSchema>>;
