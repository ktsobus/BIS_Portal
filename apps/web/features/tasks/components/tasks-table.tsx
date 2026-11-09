"use client"

import type { Task, TaskStatus } from "@workspace/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { orpc } from "@/lib/orpc"

import { priorityLabels, statusLabels } from "../task-options"

// Features, columns and fallback data live at module scope so they stay stable.
const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString },
})

const helper = createColumnHelper<typeof features, Task>()

const priorityOrder = { low: 0, medium: 1, high: 2 } as const

const columns = helper.columns([
  helper.accessor("title", {
    header: "Title",
    sortFn: "alphanumeric",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  helper.accessor("status", {
    header: "Status",
    sortFn: "alphanumeric",
    cell: (info) => (
      <Badge variant={info.getValue() === "done" ? "secondary" : "outline"}>
        {statusLabels[info.getValue()]}
      </Badge>
    ),
  }),
  helper.accessor("priority", {
    header: "Priority",
    sortFn: (a, b, id) =>
      priorityOrder[a.getValue<Task["priority"]>(id)] -
      priorityOrder[b.getValue<Task["priority"]>(id)],
    cell: (info) => priorityLabels[info.getValue()],
  }),
  helper.accessor("createdAt", {
    header: "Created",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (info) => info.getValue().toLocaleDateString(),
  }),
  helper.display({
    id: "actions",
    cell: ({ row }) => <TaskActions task={row.original} />,
  }),
])

const emptyTasks: Task[] = []

export function TasksTable() {
  const { data, isPending, isError, error } = useQuery(
    orpc.task.list.queryOptions()
  )

  const table = useTable({
    features,
    columns,
    data: data ?? emptyTasks,
    globalFilterFn: "includesString",
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  if (isError) {
    return <p className="text-sm text-destructive">{error.message}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search tasks…"
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
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <SortIcon direction={header.column.getIsSorted()} />
                      </Button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-muted-foreground">
          Page {table.state.pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUpIcon />
  if (direction === "desc") return <ArrowDownIcon />
  return <ArrowUpDownIcon className="opacity-50" />
}

function TaskActions({ task }: { task: Task }) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: orpc.task.key() })

  const updateTask = useMutation(
    orpc.task.update.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => toast.error(error.message),
    })
  )
  const deleteTask = useMutation(
    orpc.task.delete.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success("Task deleted")
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Task actions">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={task.status}
          onValueChange={(status) =>
            updateTask.mutate({ id: task.id, status: status as TaskStatus })
          }
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => deleteTask.mutate({ id: task.id })}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
