"use client"

import * as React from "react"

const SCRIPTS = [
  "/assets/system.js",
  "/assets/motion/motion.js",
  "/assets/layout/layout.js",
]

/**
 * Lädt die Skripte des Kits (Navigation, Hover- und Druckzustände, Auftritt
 * des Heros, Moment) erst nach der Hydration: Sie ergänzen Attribute und
 * Klassen im DOM, was React vor der Hydration als Abweichung werten würde.
 * Die Seiten navigieren mit normalen Links (ganze Seitenwechsel), damit die
 * Skripte auf jeder Seite einmal starten.
 */
export function KitScripts() {
  React.useEffect(() => {
    for (const src of SCRIPTS) {
      if (document.querySelector(`script[src="${src}"]`)) continue
      const script = document.createElement("script")
      script.type = "module"
      script.src = src
      document.body.appendChild(script)
    }
  }, [])
  return null
}
