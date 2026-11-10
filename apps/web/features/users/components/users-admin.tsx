"use client"

import { useState } from "react"
import type { AdminUser, UserRole } from "@workspace/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Status } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog, Dialog } from "@/components/ui/dialog"
import { Field, fieldProps, Input } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { PasswordInput } from "@/components/ui/password-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, Td, Th } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { QueryError } from "@/components/admin/query-error"
import { authClient } from "@/lib/auth-client"
import { formatDateShort } from "@/lib/format"
import { accountFields, errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { roleLabels, signInMethodLabel } from "../labels"

const createSchema = z.object(accountFields)
type CreateValues = z.infer<typeof createSchema>

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: orpc.user.list.key() })
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const toast = useToast()
  const invalidate = useInvalidateUsers()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "" },
  })
  const { errors } = form.formState
  const create = useMutation(
    orpc.user.create.mutationOptions({
      onSuccess: async (user) => {
        await invalidate()
        toast({ title: "Konto erfasst", description: user.email })
        form.reset()
        onOpenChange(false)
      },
      onError: (cause) =>
        setError(
          errorMessage(cause, {
            CONFLICT: "Zu dieser E-Mail-Adresse gibt es bereits ein Konto.",
          })
        ),
    })
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset()
          setError(null)
        }
        onOpenChange(next)
      }}
      title="Admin-Konto erfassen"
      description="Konten mit Passwort haben immer Adminrechte. Wer nur den Katalog braucht, benötigt kein Konto."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            type="submit"
            form="create-user"
            variant="primary"
            loading={create.isPending}
          >
            Konto erfassen
          </Button>
        </>
      }
    >
      <form
        id="create-user"
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          setError(null)
          create.mutate({ ...values, role: "admin" })
        })}
      >
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Field id="user-name" label="Name" error={errors.name?.message}>
          <Input
            autoComplete="off"
            {...fieldProps("user-name", { error: Boolean(errors.name) })}
            {...form.register("name")}
          />
        </Field>
        <Field
          id="user-email"
          label="E-Mail-Adresse"
          error={errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="off"
            {...fieldProps("user-email", { error: Boolean(errors.email) })}
            {...form.register("email")}
          />
        </Field>
        <Field
          id="user-password"
          label="Passwort"
          hint="Mindestens 12 Zeichen. Geben Sie es der Person auf sicherem Weg weiter; das Portal verschickt keine E-Mails."
          error={errors.password?.message}
        >
          <PasswordInput
            autoComplete="new-password"
            {...fieldProps("user-password", {
              hint: true,
              error: Boolean(errors.password),
            })}
            {...form.register("password")}
          />
        </Field>
      </form>
    </Dialog>
  )
}

type Pending =
  | { kind: "remove"; user: AdminUser }
  | { kind: "role"; user: AdminUser; role: UserRole }

function PendingDialog({
  pending,
  onClose,
}: {
  pending: Pending | null
  onClose: () => void
}) {
  const toast = useToast()
  const invalidate = useInvalidateUsers()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const remove = useMutation(orpc.user.remove.mutationOptions())

  async function confirm() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      if (pending.kind === "remove") {
        await remove.mutateAsync({ id: pending.user.id })
        toast({ title: "Konto gelöscht", description: pending.user.email })
      } else {
        // Rollen ändert nur better-auth (/admin/set-role, siehe lib/auth.ts).
        const result = await authClient.admin.setRole({
          userId: pending.user.id,
          role: pending.role,
        })
        if (result.error) throw result.error
        toast({
          title: "Rolle geändert",
          description: `${pending.user.name}: ${roleLabels[pending.role]}`,
        })
      }
      await invalidate()
      onClose()
    } catch (cause) {
      setError(
        errorMessage(cause, {
          BAD_REQUEST: "Dieses Konto kann nicht gelöscht werden.",
        })
      )
    } finally {
      setBusy(false)
    }
  }

  const removing = pending?.kind === "remove"
  return (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null)
          onClose()
        }
      }}
      title={removing ? "Konto löschen?" : "Rolle ändern?"}
      confirmLabel={removing ? "Konto löschen" : "Rolle ändern"}
      loading={busy}
      onConfirm={() => void confirm()}
      error={error ? <Notice tone="error">{error}</Notice> : null}
    >
      {pending ? (
        removing ? (
          <p>
            <strong>{pending.user.name}</strong> ({pending.user.email}) kann
            sich danach nicht mehr anmelden. Das lässt sich nicht rückgängig
            machen.
          </p>
        ) : (
          <p>
            <strong>{pending.user.name}</strong> erhält die Rolle «
            {roleLabels[pending.role]}»
            {pending.role === "admin"
              ? " und damit Zugang zur ganzen Verwaltung."
              : " und verliert den Zugang zur Verwaltung."}
          </p>
        )
      ) : null}
    </ConfirmDialog>
  )
}

/** Verwaltung › Benutzer: Konten, Rollen und Anmeldearten. */
export function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const users = useQuery(orpc.user.list.queryOptions())
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)

  return (
    <>
      <AdminPageHeader
        title="Benutzer"
        description="Admin-Konten mit Passwort und Personen, die sich mit ihrem Kantonskonto angemeldet haben."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            Admin-Konto erfassen
          </Button>
        }
      />

      {users.isPending ? (
        <Card className="space-y-4 p-6" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </Card>
      ) : users.isError ? (
        <QueryError
          error={users.error}
          retrying={users.isFetching}
          onRetry={() => void users.refetch()}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Rolle</Th>
              <Th>Anmeldung</Th>
              <Th>Zwei-Faktor</Th>
              <Th>Erfasst</Th>
              <Th>
                <span className="sr-only">Aktionen</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => {
              const self = user.id === currentUserId
              const nextRole: UserRole =
                user.role === "admin" ? "user" : "admin"
              return (
                <tr key={user.id}>
                  <Td className="md:min-w-52">
                    <span className="font-bold text-ink">{user.name}</span>
                    {self ? <span className="text-muted"> (Sie)</span> : null}
                    <span className="block text-xs break-all text-muted">
                      {user.email}
                    </span>
                  </Td>
                  <Td label="Rolle" className="whitespace-nowrap">
                    {roleLabels[user.role]}
                  </Td>
                  <Td label="Anmeldung" className="whitespace-nowrap">
                    {user.signInMethods.length > 0
                      ? user.signInMethods.map(signInMethodLabel).join(", ")
                      : "–"}
                  </Td>
                  <Td label="Zwei-Faktor">
                    {user.twoFactorEnabled ? (
                      <Status tone="ok">Eingerichtet</Status>
                    ) : (
                      <Status tone="neutral">Nicht eingerichtet</Status>
                    )}
                  </Td>
                  <Td label="Erfasst" className="whitespace-nowrap">
                    {formatDateShort(user.createdAt) ?? "–"}
                  </Td>
                  <Td className="py-2">
                    {self ? null : (
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          size="sm"
                          onClick={() =>
                            setPending({ kind: "role", user, role: nextRole })
                          }
                        >
                          {nextRole === "admin"
                            ? "Zum Admin machen"
                            : "Adminrechte entziehen"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setPending({ kind: "remove", user })}
                        >
                          Löschen
                          <span className="sr-only">: {user.name}</span>
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}

      <CreateUserDialog open={creating} onOpenChange={setCreating} />
      <PendingDialog pending={pending} onClose={() => setPending(null)} />
    </>
  )
}
