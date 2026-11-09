import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { UsersTable } from "@/features/users/components/users-table"
import { requireAdmin } from "@/lib/session"

export default async function AdminUsersPage() {
  const { user } = await requireAdmin()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Users</h2>
          <p className="text-sm text-muted-foreground">
            Public sign-up is disabled. Create password users here; SAML users
            are created on their first sign-in.
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <UsersTable currentUserId={user.id} />
    </div>
  )
}
