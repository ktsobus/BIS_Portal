import type { ComponentProps, ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** http(s)-Ziele führen aus dem Portal hinaus. */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

/**
 * Link auf ein Ziel aus den Katalogdaten. http(s)-Ziele öffnen in einem
 * neuen Tab und sind sichtbar wie hörbar gekennzeichnet; mailto und tel
 * bleiben im selben Tab.
 */
export function ExternalLink({
  href,
  children,
  className,
  showIcon = true,
  ...props
}: Omit<ComponentProps<"a">, "href" | "target" | "rel"> & {
  href: string
  children: ReactNode
  showIcon?: boolean
}) {
  const external = isExternalUrl(href)
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external ? (
        <>
          {showIcon ? (
            <ArrowUpRight
              aria-hidden="true"
              className={cn("inline size-[1.05em] shrink-0 align-[-0.15em]")}
            />
          ) : null}
          <span className="sr-only"> (öffnet in neuem Tab)</span>
        </>
      ) : null}
    </a>
  )
}
