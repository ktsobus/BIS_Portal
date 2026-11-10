import type { Metadata } from "next"

import { UsersAdmin } from "@/features/users/components/users-admin"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = { title: "Benutzer" }

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  return <UsersAdmin currentUserId={session.user.id} />
}
