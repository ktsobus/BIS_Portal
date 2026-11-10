"use client"

import type { AdminUser, UserRole } from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Dialog } from "@/components/ui/dialog"
import { LoadError } from "@/components/ui/notice"
import { Status } from "@/components/ui/status"
import { authClient } from "@/lib/auth-client"
import { formatDateShort } from "@/lib/format"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { roleLabels, signInMethodLabel } from "./labels"

type SortKey = "name" | "role" | "twoFactorEnabled" | "createdAt"
type Sort = { key: SortKey; descending: boolean }

const collator = new Intl.Collator("de-CH", { numeric: true })

function compare(a: AdminUser, b: AdminUser, key: SortKey): number {
  switch (key) {
    case "name":
      return collator.compare(a.name, b.name)
    case "role":
      return collator.compare(a.role, b.role)
    case "twoFactorEnabled":
      return Number(a.twoFactorEnabled) - Number(b.twoFactorEnabled)
    case "createdAt":
      return a.createdAt.getTime() - b.createdAt.getTime()
  }
}

/** Suche über Name und E-Mail-Adresse, ohne Gross-/Kleinschreibung. */
function matches(user: AdminUser, query: string) {
  if (!query) return true
  const needle = query.toLocaleLowerCase("de-CH")
  return `${user.name} ${user.email} ${roleLabels[user.role]}`
    .toLocaleLowerCase("de-CH")
    .includes(needle)
}

const columns: Array<{ key: SortKey | "signInMethods"; label: string }> = [
  { key: "name", label: "Name" },
  { key: "role", label: "Rolle" },
  { key: "signInMethods", label: "Anmeldung" },
  { key: "twoFactorEnabled", label: "Zwei-Faktor" },
  { key: "createdAt", label: "Erfasst" },
]

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    orpc.user.list.queryOptions()
  )
  const searchId = React.useId()
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState<Sort | null>(null)
  // Ergebnis der letzten Aktion (Rolle geändert, Konto gelöscht).
  const [notice, setNotice] = React.useState<string | null>(null)

  const rows = React.useMemo(() => {
    const filtered = (data ?? []).filter((user) => matches(user, query.trim()))
    if (!sort) return filtered
    const sorted = [...filtered].sort((a, b) => compare(a, b, sort.key))
    return sort.descending ? sorted.reverse() : sorted
  }, [data, query, sort])

  if (isError) {
    return (
      <div className="wrap">
        <LoadError
          title="Die Benutzer konnten nicht geladen werden."
          message={errorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current?.key !== key
        ? { key, descending: false }
        : current.descending
          ? null
          : { key, descending: true }
    )
  }

  return (
    <div className="wrap">
      <div className="list-tools">
        <div className="field list-tools__search">
          <label htmlFor={searchId}>Suche</label>
          <input
            id={searchId}
            type="search"
            placeholder="Name oder E-Mail-Adresse"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Status>{notice}</Status>
      </div>
      <div className="table-wrap">
        <table className="table table--stack">
          <caption className="sr-only">Benutzer</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                if (column.key === "signInMethods") {
                  return (
                    <th key={column.key} scope="col">
                      {column.label}
                    </th>
                  )
                }
                const key = column.key
                const active = sort?.key === key
                return (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={
                      active
                        ? sort.descending
                          ? "descending"
                          : "ascending"
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="table__sort"
                      onClick={() => toggleSort(key)}
                    >
                      {column.label}
                      <span aria-hidden="true">
                        {active ? (sort.descending ? "↓" : "↑") : ""}
                      </span>
                    </button>
                  </th>
                )
              })}
              <th scope="col">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  <span role="status">Benutzer werden geladen …</span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  Keine Benutzer gefunden.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id}>
                  <td data-label="Name">
                    <span className="table__name">{user.name}</span>
                    {user.id === currentUserId ? (
                      <span className="muted"> (Sie)</span>
                    ) : null}
                    <small>{user.email}</small>
                  </td>
                  <td data-label="Rolle">
                    <span
                      className={user.role === "admin" ? "tag tag--ink" : "tag"}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td data-label="Anmeldung">
                    <span className="tag-row">
                      {user.signInMethods.map((method) => (
                        <span key={method} className="tag">
                          {signInMethodLabel(method)}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td data-label="Zwei-Faktor">
                    {user.twoFactorEnabled ? "Ein" : "Aus"}
                  </td>
                  <td className="table__date" data-label="Erfasst">
                    {formatDateShort(user.createdAt) ?? "–"}
                  </td>
                  <td className="table__cell-actions">
                    {user.id === currentUserId ? null : (
                      <div className="table__actions">
                        <ChangeRoleButton user={user} onDone={setNotice} />
                        <RemoveUserButton user={user} onDone={setNotice} />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Fehler aus dem better-auth-Client als `Error` mit Code und Status. */
function toError(error: { code?: string; message?: string; status: number }) {
  return Object.assign(new Error(error.message ?? "Request failed"), {
    code: error.code,
    status: error.status,
  })
}

/**
 * Rolle wechseln (Admin ↔ Benutzer), z. B. für SAML-Benutzer, die bei der
 * ersten Anmeldung die Rolle «Benutzer» erhalten. Läuft über das
 * better-auth-Admin-Plugin; die eigene Rolle lässt sich nicht ändern.
 */
function ChangeRoleButton({
  user,
  onDone,
}: {
  user: AdminUser
  onDone: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const nextRole: UserRole = user.role === "admin" ? "user" : "admin"
  const promote = nextRole === "admin"

  const setRole = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.admin.setRole({
        userId: user.id,
        role: nextRole,
      })
      if (error) throw toError(error)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
      setOpen(false)
      onDone(
        promote
          ? `${user.name} ist jetzt Admin.`
          : `${user.name} hat keine Adminrechte mehr.`
      )
    },
  })

  const label = promote ? "Zum Admin machen" : "Adminrechte entziehen"

  return (
    <>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        aria-label={`${label}: ${user.name}`}
        onClick={() => {
          setRole.reset()
          setOpen(true)
        }}
      >
        {label}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          promote
            ? `${user.name} zum Admin machen?`
            : `${user.name} die Adminrechte entziehen?`
        }
        description={
          promote
            ? "Admins sehen den Katalog-Status, lösen Synchronisierungen aus und verwalten Benutzer, Sicherheit und SAML."
            : "Die Person kann sich weiterhin anmelden, hat aber keinen Zugriff mehr auf den Admin-Bereich."
        }
      >
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={setRole.isPending}
            onClick={() => setRole.mutate()}
          >
            {label}
          </button>
        </div>
        <Status bad={setRole.isError}>
          {setRole.isError
            ? errorMessage(
                setRole.error,
                {},
                "Die Rolle konnte nicht geändert werden."
              )
            : null}
        </Status>
      </Dialog>
    </>
  )
}

function RemoveUserButton({
  user,
  onDone,
}: {
  user: AdminUser
  onDone: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const removeUser = useMutation(
    orpc.user.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        setOpen(false)
        onDone(`${user.email} wurde gelöscht.`)
      },
    })
  )

  return (
    <>
      <button
        type="button"
        className="btn btn--danger btn--sm"
        aria-label={`${user.name} löschen`}
        onClick={() => {
          removeUser.reset()
          setOpen(true)
        }}
      >
        Löschen
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${user.name} löschen?`}
        description={`Das Konto ${user.email} wird mit allen Daten gelöscht. Das lässt sich nicht rückgängig machen.`}
      >
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={removeUser.isPending}
            onClick={() => removeUser.mutate({ id: user.id })}
          >
            Konto löschen
          </button>
        </div>
        <Status bad={removeUser.isError}>
          {removeUser.isError
            ? errorMessage(removeUser.error, {
                BAD_REQUEST: "Sie können Ihr eigenes Konto nicht löschen.",
                NOT_FOUND: "Der Benutzer existiert nicht mehr.",
              })
            : null}
        </Status>
      </Dialog>
    </>
  )
}
