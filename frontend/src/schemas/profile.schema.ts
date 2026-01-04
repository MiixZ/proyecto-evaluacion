import z from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre es muy corto"),
  lastName: z.string().min(2, "Los apellidos son muy cortos"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Máximo 500 caracteres").optional(),
  preferredLanguage: z.enum(["es", "en"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
