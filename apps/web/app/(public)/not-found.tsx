import type { Metadata } from "next"
import Link from "next/link"

import { PageHead } from "@/components/site/page-head"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

export default function NotFound() {
  return (
    <PageHead
      title="Diese Seite gibt es nicht"
      lead="Die Leistung oder der Service wurde umbenannt, verschoben oder ist nicht mehr im Katalog veröffentlicht."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary" size="lg">
          <Link href="/">Zum Katalog</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/suche">Katalog durchsuchen</Link>
        </Button>
      </div>
    </PageHead>
  )
}
