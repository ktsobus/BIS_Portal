"use client"

import type { AdminUser } from "@workspace/api"
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
import { Trash2Icon } from "lucide-react"
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
import { orpc } from "@/lib/orpc"

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

const methodLabels: Record<string, string> = {
  credential: "Password",
}

const emptyUsers: AdminUser[] = []

function buildColumns(currentUserId: string) {
  return helper.columns([
    helper.accessor("name", {
      header: "Name",
      sortFn: "alphanumeric",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-xs text-muted-foreground">
            {info.row.original.email}
          </span>
        </div>
      ),
    }),
    helper.accessor("role", {
      header: "Role",
      sortFn: "alphanumeric",
      cell: (info) => (
        <Badge variant={info.getValue() === "admin" ? "default" : "outline"}>
          {info.getValue() === "admin" ? "Admin" : "User"}
        </Badge>
      ),
    }),
    helper.accessor("signInMethods", {
      header: "Sign-in",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map((m) => (
            <Badge key={m} variant="secondary">
              {methodLabels[m] ?? `SAML: ${m}`}
            </Badge>
          ))}
        </div>
      ),
    }),
    helper.accessor("twoFactorEnabled", {
      header: "2FA",
      enableGlobalFilter: false,
      cell: (info) => (info.getValue() ? "On" : "Off"),
    }),
    helper.accessor("createdAt", {
      header: "Created",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (info) => info.getValue().toLocaleDateString(),
    }),
    helper.display({
      id: "actions",
      cell: ({ row }) =>
        row.original.id === currentUserId ? null : (
          <RemoveUserButton user={row.original} />
        ),
    }),
  ])
}

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const { data, isPending, isError, error } = useQuery(
    orpc.user.list.queryOptions()
  )

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
    return <p className="text-sm text-destructive">{error.message}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search users…"
        value={String(table.state.globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="max-w-xs"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
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
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
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

function RemoveUserButton({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient()
  const removeUser = useMutation(
    orpc.user.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        toast.success(`Removed ${user.email}`)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Remove ${user.email}`}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes {user.email} and all of their data. This can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => removeUser.mutate({ id: user.id })}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
