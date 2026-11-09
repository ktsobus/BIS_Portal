"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

const items = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/security", label: "Security" },
  { href: "/admin/saml", label: "SAML" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b pb-2">
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}
