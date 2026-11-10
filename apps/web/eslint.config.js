import { globalIgnores } from "eslint/config"

import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Unveränderte Dateien des Kits (tasteskill) und dessen Prüfstand.
  globalIgnores(["public/assets/**", ".taste-skill/**"]),
  {
    rules: {
      // Die Oberfläche steht auf dem Kit von tasteskill (siehe AGENTS.md):
      // Dessen Skripte starten einmal pro Seitenaufruf, deshalb navigieren die
      // Seiten mit normalen Links und `window.location.assign` statt mit
      // `next/link` und dem Router.
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      // Die Stylesheets des Kits stehen in fester Reihenfolge als Links im
      // Wurzel-Layout.
      "@next/next/no-css-tags": "off",
      // Fotografien liegen fertig zugeschnitten in `public/assets/img`
      // (mit `srcset`, Breite und Höhe); das Logo ist ein SVG.
      "@next/next/no-img-element": "off",
    },
  },
]
