import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"

export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done"])
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"])

export const task = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: taskStatus("status").default("todo").notNull(),
    priority: taskPriority("priority").default("medium").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("task_userId_idx").on(table.userId)]
)
