import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Weisse Fläche mit Haarlinie; keine Schatten, nie verschachtelt. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-line bg-white", className)}
      {...props}
    />
  )
}
