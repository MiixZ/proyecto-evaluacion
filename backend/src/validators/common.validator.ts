import { z } from 'zod';

export const uuidSchema = z.string().uuid('ID inválido, debe ser UUID v4');
export const emailSchema = z.string().email('Email inválido').toLowerCase();
export const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido');

export const urlSchema = z.string().url('URL inválida');

export const languageCodeSchema = z
  .string()
  .min(1, 'El código del lenguaje es requerido')
  .max(20, 'Código de lenguaje demasiado largo')
  .describe('Código del lenguaje de programación (ej: python, java, cpp)');
