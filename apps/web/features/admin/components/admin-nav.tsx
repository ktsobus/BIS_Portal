import type { PrimaryTab } from "@/components/site/primary-tabs"

/** Reiter des Admin-Bereichs (Hauptreiter im Kopf, aktiver Reiter rot). */
export const ADMIN_TABS: PrimaryTab[] = [
  { href: "/admin/catalog", label: "Katalog" },
  { href: "/admin/users", label: "Benutzer" },
  { href: "/admin/security", label: "Sicherheit" },
  { href: "/admin/saml", label: "SAML" },
]
