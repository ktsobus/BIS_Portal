import type { Metadata } from "next"

import { NotFoundContent } from "@/features/catalog/components/not-found-content"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

export default function NotFound() {
  return <NotFoundContent />
}
