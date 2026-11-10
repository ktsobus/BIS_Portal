import type { Metadata } from "next"

import { SamlAdmin } from "@/features/sso/components/saml-admin"

export const metadata: Metadata = { title: "Kantonskonto (SAML)" }

export default function AdminSamlPage() {
  return <SamlAdmin />
}
