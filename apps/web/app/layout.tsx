import type { Metadata } from "next"

// Source Sans 3 (frei, selbst gehostet) als Ersatz für Frutiger: genutzt
// werden nur 400 (≙ 55 Roman) und 800 (≙ 75 Black), kursiv nur für den
// Absender (CD-Manual). Bewusst nicht über next/font/google, der Build-Server
// hat evtl. kein Internet.
import "@fontsource-variable/source-sans-3/wght.css"
import "@fontsource-variable/source-sans-3/wght-italic.css"
import "./globals.css"

import { Providers } from "@/components/providers"

const siteName = "Business-IT-Serviceportal"

export const metadata: Metadata = {
  title: {
    default: `${siteName} – Kanton Solothurn`,
    template: `%s – ${siteName}`,
  },
  description:
    "Business-IT-Services des Amts für Informatik und Organisation (AIO): Leistungen, Verantwortliche und nächste Schritte.",
  applicationName: siteName,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de-CH"
      suppressHydrationWarning
      // Seitenwechsel springen sofort; nur Sprungmarken gleiten (globals.css).
      data-scroll-behavior="smooth"
      className="antialiased"
    >
      <body>
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:border focus:border-hairline focus:bg-background focus:px-5 focus:py-3 focus:text-foreground"
        >
          Zum Inhalt
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
