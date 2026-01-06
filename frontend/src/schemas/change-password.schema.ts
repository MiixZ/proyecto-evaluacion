import z from "zod";
import { TFunction } from "i18next";

export const getChangePasswordSchema = (t: TFunction) => {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t("auth.validation.current_password_required")),
      newPassword: z.string().min(8, t("auth.validation.password_min")),
      confirmPassword: z
        .string()
        .min(1, t("auth.validation.confirm_password_required")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth.validation.passwords_not_match"),
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t("auth.validation.new_password_different"),
      path: ["newPassword"],
    });
};

export type ChangePasswordFormValues = z.infer<
  ReturnType<typeof getChangePasswordSchema>
>;
