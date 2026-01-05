import { z } from "zod";
import { TFunction } from "i18next";

/**
 * Schema para crear un nuevo usuario
 */
export const getCreateUserSchema = (t: TFunction) => {
  return z.object({
    email: z.string().email(t("admin.users.validation.invalid_email")),
    password: z
      .string()
      .min(8, t("admin.users.validation.password_min"))
      .optional(),
    firstName: z
      .string()
      .min(1, t("admin.users.validation.first_name_required"))
      .max(100),
    lastName: z
      .string()
      .min(1, t("admin.users.validation.last_name_required"))
      .max(100),
    role: z
      .enum(["admin", "teacher", "student"], {
        errorMap: () => ({ message: t("admin.users.validation.invalid_role") }),
      })
      .default("student"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, t("admin.users.validation.invalid_phone"))
      .optional(),
    preferredLanguage: z.enum(["es", "en"]).default("es"),
  });
};

/**
 * Schema para asignar usuario a grupo
 */
export const getAssignToGroupSchema = (t: TFunction) => {
  return z.object({
    userId: z.string().uuid(t("admin.users.validation.invalid_user_id")),
    groupId: z.string().uuid(t("admin.users.validation.invalid_group_id")),
  });
};

/**
 * Schema para cambiar rol de usuario
 */
export const getChangeRoleSchema = (t: TFunction) => {
  return z.object({
    role: z.enum(["admin", "teacher", "student"], {
      errorMap: () => ({ message: t("admin.users.validation.invalid_role") }),
    }),
  });
};

/**
 * Schema para cambiar estado de usuario
 */
export const getChangeStatusSchema = (t: TFunction) => {
  return z.object({
    status: z.enum(["active", "inactive", "suspended"], {
      errorMap: () => ({ message: t("admin.users.validation.invalid_status") }),
    }),
  });
};

export type CreateUserFormValues = z.infer<
  ReturnType<typeof getCreateUserSchema>
>;
export type AssignToGroupFormValues = z.infer<
  ReturnType<typeof getAssignToGroupSchema>
>;
export type ChangeRoleFormValues = z.infer<
  ReturnType<typeof getChangeRoleSchema>
>;
export type ChangeStatusFormValues = z.infer<
  ReturnType<typeof getChangeStatusSchema>
>;
