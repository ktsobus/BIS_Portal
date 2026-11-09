import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-underline flex field-sizing-content min-h-24 w-full rounded-none border-0 border-b border-input bg-tile-teaser px-3 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
