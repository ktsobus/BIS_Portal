import { redirect } from "next/navigation"

/** Die Verwaltung beginnt beim Katalog: Abgleich und Datenqualität. */
export default function AdminPage() {
  redirect("/admin/catalog")
}
