import type { ComponentProps } from "react"

import { Input } from "@/components/ui/field"
import { cn } from "@/lib/utils"

/**
 * Feld für den sechsstelligen Code der Authenticator-App. Ein einzelnes
 * Feld: Einfügen, Autofill und Screenreader funktionieren ohne Sonderfälle.
 */
export function CodeInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]*"
      spellCheck={false}
      className={cn(
        "h-12 max-w-44 text-xl font-bold tracking-[0.3em] tabular-nums",
        className
      )}
      {...props}
    />
  )
}
