"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyRound, RefreshCw, ShieldCheck, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin/catalog", label: "Katalog", icon: RefreshCw },
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/saml", label: "Kantonskonto", icon: KeyRound },
  { href: "/admin/security", label: "Sicherheit", icon: ShieldCheck },
] as const

/**
 * Navigation der Verwaltung: seitlich ab Desktop, darunter als Raster mit
 * allen vier Zielen. Die aktuelle Seite trägt das rote Quadrat.
 */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Verwaltung"
      className="grid grid-cols-2 gap-1 lg:flex lg:flex-col"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex h-10 min-w-0 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 ease-out",
              current
                ? "bg-blue-tint font-bold text-ink"
                : "text-text hover:bg-ground"
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                current ? "text-blue" : "text-muted"
              )}
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {current ? (
              <span aria-hidden="true" className="size-2 shrink-0 bg-red" />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
