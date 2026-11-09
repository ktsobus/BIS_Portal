import type { Metadata } from "next"

// Source Sans 3 (frei, selbst gehostet): normal und kursiv, variable Gewichte.
// Bewusst nicht über next/font/google, der Build-Server hat evtl. kein Internet.
import "@fontsource-variable/source-sans-3/wght.css"
import "@fontsource-variable/source-sans-3/wght-italic.css"
import "./globals.css"

import { Providers } from "@/components/providers"

const siteName = "Business-IT-Serviceportal · Kanton Solothurn"

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "Business-IT-Services des Amts für Informatik und Organisation (AIO): Leistungen, Verantwortliche und nächste Schritte.",
  applicationName: "Business-IT-Serviceportal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de-CH" suppressHydrationWarning className="antialiased">
      <body>
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:font-bold focus:text-foreground focus:underline"
        >
          Zum Inhalt
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
