import { z } from 'zod';
import { passwordSchema } from './common.validator';

/**
 * Schema para cambiar contraseña
 */
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema.refine(
      (pwd) => pwd.length >= 8,
      'La nueva contraseña debe tener al menos 8 caracteres'
    ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changePasswordRequest = z.object({
  body: changePasswordSchema,
});
