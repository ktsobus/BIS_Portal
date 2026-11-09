import type { Metadata } from "next"

import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { CatalogAdminOverview } from "@/features/catalog-admin/components/catalog-admin-overview"

export const metadata: Metadata = { title: "Katalog" }

export default function AdminCatalogPage() {
  return (
    <>
      <AdminPageHeader
        title="Katalog"
        description="Stand der Daten aus SAP LeanIX, Synchronisierung und Datenqualitätsbericht für das Service-Management."
      />
      <CatalogAdminOverview />
    </>
  )
}
