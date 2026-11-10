"use client"

import { usePathname } from "next/navigation"

const items = [
  { href: "/admin/catalog", label: "Katalog" },
  { href: "/admin/users", label: "Benutzer" },
  { href: "/admin/saml", label: "SAML" },
  { href: "/admin/security", label: "Sicherheit" },
]

/** Bereiche der Verwaltung; der aktuelle ist mit `aria-current` markiert. */
export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="subnav" aria-label="Verwaltung">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
