"use client"

import { Switch as Primitive } from "radix-ui"

import { cn } from "@/lib/utils"

/** Schalter für eine Einstellung, die sofort gilt. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line-strong bg-ground-strong transition-colors duration-150 ease-out hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue data-[state=checked]:bg-blue",
        className
      )}
      {...props}
    >
      <Primitive.Thumb className="block size-4 translate-x-[3px] rounded-full bg-muted transition-transform duration-150 ease-out data-[state=checked]:translate-x-[23px] data-[state=checked]:bg-white" />
    </Primitive.Root>
  )
}
