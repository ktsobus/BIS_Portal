import type { Metadata, Viewport } from "next"

import { KitScripts } from "@/components/kit-scripts"
import { Providers } from "@/components/providers"

export const siteName = "BITS-Portal"

const title = `${siteName}: IT-Services für die kantonale Verwaltung Solothurn`
const description =
  "Die Business-IT-Services des Amts für Informatik und Organisation: jede Leistung mit Beschreibung, zuständiger Stelle und dem Weg zur Bestellung."

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: { default: title, template: `%s · ${siteName}` },
  description,
  applicationName: siteName,
  openGraph: {
    type: "website",
    title,
    description,
    images: ["/share.jpg"],
  },
  twitter: { card: "summary_large_image" },
  other: {
    // tasteskill: Die Seitenart steuert, was die Prüfskripte erwarten.
    "site-kind": "other",
    "page-type": "service",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

/*
 * Die Oberfläche steht auf dem Kit von tasteskill 2.5.1: `public/assets`
 * enthält dessen Dateien unverändert (System, Motion, Layout, Moment), die
 * Seiten verwenden dessen Klassen. Eigene Regeln stehen in
 * `public/styles/portal.css` und werden nach dem Kit geladen. Die Reihenfolge
 * der Stylesheets ist verbindlich, deshalb stehen sie hier als Links und
 * werden nicht importiert.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de-CH"
      data-type="service"
      data-radius="soft"
      data-buttons="tonal"
      data-motion=""
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/styles/portal.css" />
        <link rel="stylesheet" href="/styles/admin.css" />
        {/* Auftritt des Heros (motion.md): vor dem ersten Bild setzen. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700);document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)",
          }}
        />
        <link rel="modulepreload" href="/assets/moments/moments.js" />
        <link rel="modulepreload" href="/assets/moments/lib.js" />
        <link
          rel="modulepreload"
          href="/assets/moments/word-highlight/moment.js"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <KitScripts />
      </body>
    </html>
  )
}
