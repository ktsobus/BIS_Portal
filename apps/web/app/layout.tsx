import type { Metadata, Viewport } from "next"

import { Providers } from "@/components/providers"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "BITS-Portal · Kanton Solothurn",
    template: "%s · BITS-Portal",
  },
  description:
    "Business IT-Servicekatalog des Amts für Informatik und Organisation (AIO), Kanton Solothurn: IT-Leistungen finden, bestellen und anfragen.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de-CH">
      <head>
        <link
          rel="preload"
          href="/fonts/open-sans/open-sans-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
