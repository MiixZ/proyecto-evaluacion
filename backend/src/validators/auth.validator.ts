import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.validator';

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginRequest = z.object({
  body: loginSchema,
});
