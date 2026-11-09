import { z } from "zod"

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"])
export const taskPrioritySchema = z.enum(["low", "medium", "high"])

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  createdAt: z.date(),
})

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
})

export const updateTaskInputSchema = createTaskInputSchema.partial().extend({
  id: z.string(),
})

export type Task = z.infer<typeof taskSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>
