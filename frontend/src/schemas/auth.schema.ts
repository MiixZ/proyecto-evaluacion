import { z } from "zod";
import { TFunction } from "i18next";

const baseLoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type LoginFormValues = z.infer<typeof baseLoginSchema>;

/**
 * Genera el esquema de validación para el login con mensajes traducidos.
 * @param t Función de traducción de i18next
 */
export const getLoginSchema = (t: TFunction) => {
  return z.object({
    email: z.string().email({ message: t("auth.validation.email_invalid") }),
    password: z
      .string()
      .min(1, { message: t("auth.validation.password_required") }),
  });
};
