import Link from "next/link"

import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog"
import { TasksTable } from "@/features/tasks/components/tasks-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { requireSession } from "@/lib/session"

export default async function DashboardPage() {
  const { user } = await requireSession()

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <header className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="mr-auto">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        {user.role === "admin" && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Admin</Link>
          </Button>
        )}
        <SignOutButton />
      </header>
      <main className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <CreateTaskDialog />
        </div>
        <TasksTable />
      </main>
    </div>
  )
}
