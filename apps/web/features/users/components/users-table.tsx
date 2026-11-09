"use client"

import type { AdminUser, UserRole } from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { ShieldCheckIcon, ShieldOffIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { formatDateShort } from "@/lib/format"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { roleLabels, signInMethodLabel } from "./labels"

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString },
})

const helper = createColumnHelper<typeof features, AdminUser>()

const emptyUsers: AdminUser[] = []

function buildColumns(currentUserId: string) {
  return helper.columns([
    helper.accessor("name", {
      header: "Name",
      sortFn: "alphanumeric",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-bold">
            {info.getValue()}
            {info.row.original.id === currentUserId ? (
              <span className="font-normal text-muted-foreground"> (Sie)</span>
            ) : null}
          </span>
          <span className="text-sm text-muted-foreground">
            {info.row.original.email}
          </span>
        </div>
      ),
    }),
    helper.accessor("role", {
      header: "Rolle",
      sortFn: "alphanumeric",
      cell: (info) => (
        // Admin schwarz wie die Kennzeichnung «Administration» im Kopf;
        // Rot bleibt Fehlern und Aktionen vorbehalten.
        <Badge
          variant="outline"
          className={
            info.getValue() === "admin"
              ? "border-foreground bg-foreground text-background"
              : undefined
          }
        >
          {roleLabels[info.getValue()]}
        </Badge>
      ),
    }),
    helper.accessor("signInMethods", {
      header: "Anmeldung",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map((m) => (
            <Badge key={m} variant="secondary">
              {signInMethodLabel(m)}
            </Badge>
          ))}
        </div>
      ),
    }),
    helper.accessor("twoFactorEnabled", {
      header: "Zwei-Faktor",
      enableGlobalFilter: false,
      cell: (info) => (info.getValue() ? "Ein" : "Aus"),
    }),
    helper.accessor("createdAt", {
      header: "Erfasst",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (info) => formatDateShort(info.getValue()) ?? "–",
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Aktionen</span>,
      cell: ({ row }) =>
        row.original.id === currentUserId ? null : (
          <div className="flex items-center justify-end gap-1">
            <ChangeRoleButton user={row.original} />
            <RemoveUserButton user={row.original} />
          </div>
        ),
    }),
  ])
}

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const { data, isPending, isError, error, refetch } = useQuery(
    orpc.user.list.queryOptions()
  )
  const searchId = React.useId()

  // Columns must be stable across renders; only the actions cell depends on props.
  const columns = React.useMemo(
    () => buildColumns(currentUserId),
    [currentUserId]
  )

  const table = useTable({
    features,
    columns,
    data: data ?? emptyUsers,
    globalFilterFn: "includesString",
  })

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-3xl p-4">
        <AlertTitle className="text-base font-bold">
          Die Benutzer konnten nicht geladen werden.
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3 text-foreground!">
          <p>{errorMessage(error)}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full max-w-sm flex-col gap-1.5">
        <label htmlFor={searchId} className="text-sm font-bold">
          Suche
        </label>
        <Input
          id={searchId}
          type="search"
          placeholder="Name oder E-Mail-Adresse"
          value={String(table.state.globalFilter ?? "")}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          autoComplete="off"
          className="h-10"
        />
      </div>
      <div className="border border-border">
        <Table>
          <caption className="sr-only">Benutzer</caption>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} scope="col">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Skeleton className="h-6 w-full" />
                  <span className="sr-only" role="status">
                    Benutzer werden geladen …
                  </span>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-muted-foreground"
                >
                  Keine Benutzer gefunden.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
function ChangeRoleButton({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient()
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
      toast.success(
        promote
          ? `${user.name} ist jetzt Admin.`
          : `${user.name} hat keine Adminrechte mehr.`
      )
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, {}, "Die Rolle konnte nicht geändert werden.")
      ),
  })

  const label = promote ? "Zum Admin machen" : "Adminrechte entziehen"

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          disabled={setRole.isPending}
          aria-label={`${label}: ${user.name}`}
        >
          {promote ? (
            <ShieldCheckIcon aria-hidden="true" />
          ) : (
            <ShieldOffIcon aria-hidden="true" />
          )}
          <span className="hidden lg:inline">{label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {promote
              ? `${user.name} zum Admin machen?`
              : `${user.name} die Adminrechte entziehen?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {promote
              ? "Admins sehen den Katalog-Status, lösen Synchronisierungen aus und verwalten Benutzer, Sicherheit und SAML."
              : "Die Person kann sich weiterhin anmelden, hat aber keinen Zugriff mehr auf den Admin-Bereich."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={() => setRole.mutate()}>
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RemoveUserButton({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient()
  const removeUser = useMutation(
    orpc.user.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        toast.success(`${user.email} wurde gelöscht.`)
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, {
            BAD_REQUEST: "Sie können Ihr eigenes Konto nicht löschen.",
            NOT_FOUND: "Der Benutzer existiert nicht mehr.",
          })
        ),
    })
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={removeUser.isPending}
          aria-label={`${user.name} löschen`}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{user.name} löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Das Konto {user.email} wird mit allen Daten gelöscht. Das lässt sich
            nicht rückgängig machen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => removeUser.mutate({ id: user.id })}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
