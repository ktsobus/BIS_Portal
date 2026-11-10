import type { Metadata } from "next"

import { CatalogAdmin } from "@/features/catalog-admin/components/catalog-admin"

export const metadata: Metadata = { title: "Katalog" }

export default function AdminCatalogPage() {
  return <CatalogAdmin />
}
