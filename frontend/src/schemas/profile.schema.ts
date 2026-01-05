import z from "zod";
import { TFunction } from "i18next";

export const getProfileSchema = (t: TFunction) => {
  return z.object({
    firstName: z.string().min(2, t("auth.validation.first_name_short")),
    lastName: z.string().min(2, t("auth.validation.last_name_short")),
    phone: z.string().optional(),
    bio: z.string().max(500, t("auth.validation.bio_max")).optional(),
    preferredLanguage: z.enum(["es", "en"]),
  });
};

export type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;
