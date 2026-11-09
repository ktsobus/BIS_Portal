import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import { authed, os } from "@/server/orpc"

const taskColumns = {
  id: schema.task.id,
  title: schema.task.title,
  status: schema.task.status,
  priority: schema.task.priority,
  createdAt: schema.task.createdAt,
}

export const taskRouter = {
  list: os.task.list
    .use(authed)
    .handler(({ context }) =>
      db
        .select(taskColumns)
        .from(schema.task)
        .where(eq(schema.task.userId, context.user.id))
        .orderBy(desc(schema.task.createdAt))
    ),

  create: os.task.create.use(authed).handler(async ({ input, context }) => {
    const [created] = await db
      .insert(schema.task)
      .values({ ...input, userId: context.user.id })
      .returning(taskColumns)
    return created!
  }),

  update: os.task.update
    .use(authed)
    .handler(async ({ input: { id, ...values }, context, errors }) => {
      const [updated] = await db
        .update(schema.task)
        .set(values)
        .where(
          and(eq(schema.task.id, id), eq(schema.task.userId, context.user.id))
        )
        .returning(taskColumns)
      if (!updated) throw errors.NOT_FOUND()
      return updated
    }),

  delete: os.task.delete
    .use(authed)
    .handler(async ({ input, context, errors }) => {
      const deleted = await db
        .delete(schema.task)
        .where(
          and(
            eq(schema.task.id, input.id),
            eq(schema.task.userId, context.user.id)
          )
        )
        .returning({ id: schema.task.id })
      if (deleted.length === 0) throw errors.NOT_FOUND()
    }),
}
