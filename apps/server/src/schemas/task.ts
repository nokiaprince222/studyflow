import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const listTaskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  q: z.string().trim().max(120).optional()
});

export const taskParamsSchema = z.object({
  id: z.string().min(1)
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  dueDate: z.string().datetime().nullable().optional().default(null)
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Нужно передать хотя бы одно поле для обновления');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

