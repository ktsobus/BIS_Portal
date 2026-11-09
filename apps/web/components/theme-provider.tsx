"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Das Portal kennt im PoC nur das helle CD-Theme: `forcedTheme="light"`,
 * keine Systemerkennung und kein Tastenkürzel zum Umschalten.
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      // next-themes renders an inline <script> to set the theme before paint.
      // It only matters in the server HTML; on the client React 19 warns about
      // it. A non-JS type on the client silences the warning (the script has
      // suppressHydrationWarning, so the attribute mismatch is fine).
      scriptProps={
        typeof window === "undefined" ? undefined : { type: "application/json" }
      }
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
