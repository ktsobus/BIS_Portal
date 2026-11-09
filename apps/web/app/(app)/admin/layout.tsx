import Link from "next/link"

import { AdminNav } from "@/features/admin/components/admin-nav"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center gap-4">
        <h1 className="mr-auto text-2xl font-semibold">Admin</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to app</Link>
        </Button>
      </header>
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}
