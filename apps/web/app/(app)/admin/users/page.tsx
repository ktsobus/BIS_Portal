import type { Metadata } from "next"

import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { UsersTable } from "@/features/users/components/users-table"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = { title: "Benutzer" }

export default async function AdminUsersPage() {
  const { user } = await requireAdmin()

  return (
    <>
      <AdminPageHeader
        title="Benutzer"
        description="Eine öffentliche Registrierung gibt es nicht; der Katalog ist ohne Anmeldung zugänglich. Hier erfassen Sie Admin-Konten mit Passwort. Wer sich über SAML anmeldet, erhält bei der ersten Anmeldung die Rolle «Benutzer» ohne Zugriff auf den Admin-Bereich; machen Sie die Person hier zum Admin."
        action={<CreateUserDialog />}
      />
      <UsersTable currentUserId={user.id} />
    </>
  )
}
