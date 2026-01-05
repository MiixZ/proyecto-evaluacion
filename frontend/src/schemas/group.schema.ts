import { z } from "zod";
import { TFunction } from "i18next";

/**
 * Schema para crear/editar un grupo
 */
export const getGroupSchema = (t: TFunction) => {
  return z.object({
    name: z
      .string()
      .min(2, t("professor.groups.validation.name_min"))
      .max(100, t("professor.groups.validation.name_max")),
    courseId: z.string().uuid(t("professor.groups.validation.invalid_course")),
    capacity: z
      .number()
      .int()
      .positive(t("professor.groups.validation.capacity_positive"))
      .max(500, t("professor.groups.validation.capacity_max"))
      .optional(),
    academicYear: z
      .string()
      .regex(
        /^\d{4}\/\d{4}$/,
        t("professor.groups.validation.invalid_year_format")
      )
      .optional(),
  });
};

/**
 * Schema para añadir un estudiante a un grupo
 */
export const getAddStudentToGroupSchema = (t: TFunction) => {
  return z.object({
    groupId: z.string().uuid(t("professor.groups.validation.invalid_group")),
    studentId: z
      .string()
      .uuid(t("professor.groups.validation.invalid_student")),
  });
};

export type GroupFormValues = z.infer<ReturnType<typeof getGroupSchema>>;
export type AddStudentFormValues = z.infer<
  ReturnType<typeof getAddStudentToGroupSchema>
>;
