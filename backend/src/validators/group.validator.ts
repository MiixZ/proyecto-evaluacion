import { z } from 'zod';
import { uuidSchema, emailSchema } from './common.validator';
import { UserRole } from '@CustomTypes/common.types';

export const createGroupSchema = z.object({
  courseId: uuidSchema,
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

export const updateGroupSchema = createGroupSchema
  .partial()
  .omit({ courseId: true });

export const enrollMemberSchema = z
  .object({
    userId: uuidSchema.optional(),
    email: emailSchema.optional(),
    role: z
      .enum([UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER])
      .default(UserRole.STUDENT),
  })
  .refine((data) => data.userId || data.email, {
    message: 'Debe proporcionar userId o email',
    path: ['userId'],
  });

export const createGroupRequest = z.object({ body: createGroupSchema });
export const updateGroupRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateGroupSchema,
});
export const enrollMemberRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: enrollMemberSchema,
});
export const getGroupRequest = z.object({
  params: z.object({ id: uuidSchema }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type EnrollMemberInput = z.infer<typeof enrollMemberSchema>;
