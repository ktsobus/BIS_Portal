import type { ComponentProps } from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

import { Spinner } from "./spinner"

type Variant = "primary" | "secondary" | "quiet" | "danger"
type Size = "sm" | "md" | "lg"

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-bold whitespace-nowrap transition-colors duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-[1.125em] [&_svg]:shrink-0"

const variants: Record<Variant, string> = {
  primary:
    "border-red bg-red text-white hover:border-red-strong hover:bg-red-strong active:bg-red-strong",
  secondary:
    "border-line-strong bg-white text-ink hover:border-ink hover:bg-ground active:bg-ground-strong",
  quiet:
    "border-transparent bg-transparent text-blue hover:bg-blue-tint active:bg-blue-tint-strong",
  danger:
    "border-red-line bg-white text-red hover:border-red hover:bg-red-tint active:bg-red-tint",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
}

export function buttonClass({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: Variant
  size?: Size
  className?: string
} = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant
  size?: Size
  /** Zeigt einen Spinner und sperrt die Schaltfläche. */
  loading?: boolean
  /** Rendert das Kind (z. B. einen Link) mit dem Aussehen der Schaltfläche. */
  asChild?: boolean
}

export function Button({
  variant,
  size,
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = buttonClass({ variant, size, className })
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    )
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}
