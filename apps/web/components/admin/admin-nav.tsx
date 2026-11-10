"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyRound, RefreshCw, ShieldCheck, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin/catalog", label: "Katalog", icon: RefreshCw },
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/saml", label: "Kantonskonto (SAML)", icon: KeyRound },
  { href: "/admin/security", label: "Sicherheit", icon: ShieldCheck },
] as const

/** Navigation der Verwaltung: seitlich ab Desktop, als Zeile darunter. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Verwaltung"
      className="-mx-2 flex gap-1 overflow-x-auto px-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap transition-colors duration-150 ease-out",
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
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
