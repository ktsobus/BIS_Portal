import type { ReactNode } from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

type NoticeTone = "info" | "ok" | "warning" | "error"

const tones: Record<NoticeTone, { box: string; icon: string }> = {
  info: { box: "border-blue-line bg-blue-tint", icon: "text-blue" },
  ok: { box: "border-green-line bg-green-tint", icon: "text-green-strong" },
  warning: {
    box: "border-orange-line bg-orange-tint",
    icon: "text-orange-strong",
  },
  error: { box: "border-red-line bg-red-tint", icon: "text-red" },
}

const icons = {
  info: Info,
  ok: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
}

/** Hinweis im Seitenfluss. Fehler werden Screenreadern sofort gemeldet. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const Icon = icons[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-md border px-4 py-3 text-sm text-text",
        tones[tone].box,
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 size-[1.125rem] shrink-0", tones[tone].icon)}
      />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-bold text-ink">{title}</p> : null}
        {children ? (
          <div className={cn(title ? "mt-0.5" : undefined)}>{children}</div>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  )
}
