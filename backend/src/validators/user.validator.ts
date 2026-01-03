import { z } from 'zod';
import { LanguageTypes, UserRole, UserStatus } from '@CustomTypes/common.types';
import {
  emailSchema,
  paginationSchema,
  passwordSchema,
  phoneSchema,
  urlSchema,
} from './common.validator';

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  phone: phoneSchema.optional(),
  profileImageUrl: urlSchema.optional(),
  bio: z.string().max(500).optional(),
  preferredLanguage: z.enum(LanguageTypes).default('es'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, 'La biografía no puede exceder los 500 caracteres')
    .optional()
    .or(z.literal('')),
  preferredLanguage: z
    .enum(['es', 'en'], {
      errorMap: () => ({ message: 'Idioma no soportado (es, en)' }),
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({
      message: 'Rol inválido. Roles permitidos: admin, teacher, student',
    }),
  }),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: 'Estado inválido.' }),
  }),
});

export const listUsersRequest = z.object({
  query: paginationSchema.extend({
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().optional(),
  }),
});

export const createUserRequest = z.object({ body: createUserSchema });

export const updateUserRequest = z.object({
  body: updateUserSchema,
});

export const changeRoleRequest = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: changeRoleSchema,
});

export const changeStatusRequest = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: changeStatusSchema,
});
