"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin/catalog", label: "Katalog" },
  { href: "/admin/users", label: "Benutzer" },
  { href: "/admin/security", label: "Sicherheit" },
  { href: "/admin/saml", label: "SAML" },
]

/** Reiter des Admin-Bereichs; der aktive Reiter ist rot unterstrichen. */
export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Administration" className="-mb-px">
      <ul className="flex flex-wrap items-end gap-x-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-base hover:border-foreground",
                  active && "border-primary font-bold hover:border-primary"
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
