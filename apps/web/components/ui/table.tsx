import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const stackedClasses =
  "max-md:block max-md:[&_tbody]:block max-md:[&_td]:block max-md:[&_td]:border-0 max-md:[&_td]:px-0 max-md:[&_td]:py-1 max-md:[&_td]:text-left max-md:[&_td:empty]:hidden max-md:[&_thead]:sr-only max-md:[&_tr]:block max-md:[&_tr]:border-b max-md:[&_tr]:border-line max-md:[&_tr]:px-4 max-md:[&_tr]:py-3 max-md:[&_tr:last-child]:border-b-0"

/**
 * Tabelle in einem Rahmen. Auf schmalen Bildschirmen wird jede Zeile zu
 * einem Block (die Spaltentitel stehen dann als `label` bei den Zellen),
 * damit niemand seitlich scrollen muss.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          stackedClasses,
          className
        )}
        {...props}
      />
    </div>
  )
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-ground px-4 py-2.5 text-xs font-bold whitespace-nowrap text-muted",
        className
      )}
      {...props}
    />
  )
}

export function Td({
  className,
  label,
  ...props
}: ComponentProps<"td"> & {
  /** Spaltentitel für die Blockansicht auf schmalen Bildschirmen. */
  label?: string
}) {
  return (
    <td
      data-label={label}
      className={cn(
        "border-b border-line px-4 py-3 align-top text-text [tr:last-child>&]:border-b-0",
        label &&
          "max-md:before:block max-md:before:text-xs max-md:before:text-muted max-md:before:content-[attr(data-label)]",
        className
      )}
      {...props}
    />
  )
}
