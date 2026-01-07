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

/**
 * Schema para primer cambio de contraseña (sin contraseña actual)
 */
export const firstPasswordChangeSchema = z
  .object({
    newPassword: passwordSchema.refine(
      (pwd) => pwd.length >= 8,
      'La contraseña debe tener al menos 8 caracteres'
    ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type FirstPasswordChangeInput = z.infer<
  typeof firstPasswordChangeSchema
>;

export const firstPasswordChangeRequest = z.object({
  body: firstPasswordChangeSchema,
});
