import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

import { logos, type LogoName } from "../logos"

/** A library logo as inline SVG, in its brand colour where that has contrast. */
export function Logo({
  name,
  className,
  title,
}: {
  name: LogoName
  className?: string
  /** Accessible label. Omit when the name is shown next to the logo. */
  title?: string
}) {
  const logo = logos[name]
  return (
    <svg
      viewBox={logo.viewBox}
      fill="currentColor"
      className={cn("size-5 shrink-0", className)}
      style={"color" in logo ? { color: logo.color } : undefined}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {logo.paths.map((path) => (
        <path
          key={path.d.slice(0, 32)}
          d={path.d}
          fill={"fill" in path ? path.fill : undefined}
          fillRule={"fillRule" in path ? path.fillRule : undefined}
        />
      ))}
    </svg>
  )
}

/** Square tile holding a logo, or a Lucide icon for libraries without one. */
export function LogoTile({
  name,
  icon: Icon,
  className,
}: {
  name?: LogoName
  icon?: LucideIcon
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-foreground/5",
        className
      )}
    >
      {name ? (
        <Logo name={name} />
      ) : Icon ? (
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      ) : null}
    </span>
  )
}
