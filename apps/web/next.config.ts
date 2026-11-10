import path from "node:path"

import type { NextConfig } from "next"
import { PHASE_DEVELOPMENT_SERVER } from "next/constants"

/**
 * Content Security Policy ohne Nonces: Das Portal lädt nichts von fremden
 * Hosts (Schrift und Logo liegen lokal). `'unsafe-inline'` ist für die
 * Inline-Skripte von Next.js und next-themes nötig, `'unsafe-eval'` nur im
 * Entwicklungsmodus (React-Fehleranzeige). Externe Links (LeanIX, ky2help,
 * SmartForm) sind Navigationen und von der Policy nicht betroffen.
 * Eine Nonce-basierte Policy würde dynamisches Rendering aller Seiten
 * erzwingen (Next.js-Doku «Content Security Policy») und ist ein späterer
 * Schritt. HSTS setzt der TLS-Proxy (docs/betrieb.md).
 */
function contentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
}

function securityHeaders(isDev: boolean) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(isDev) },
    // Für ältere Browser zusätzlich zu `frame-ancestors 'none'` (Clickjacking).
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ]
}

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER
  return {
    // Self-contained server in .next/standalone, used by the root Dockerfile.
    output: "standalone",
    // Trace from the monorepo root so workspace packages (and pnpm's hoisted
    // node_modules) end up in the standalone output.
    outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
    // The API contract package ships TypeScript source.
    transpilePackages: ["@workspace/api"],
    // Kein «X-Powered-By: Next.js».
    poweredByHeader: false,
    // Kein schwebendes Next.js-Abzeichen im Entwicklungsmodus: Die Seite hat
    // ausser der Kopfzeile nichts Fixiertes (und die Prüfskripte messen das).
    devIndicators: false,
    async headers() {
      return [
        {
          source: "/:path*{/}?",
          headers: [
            // Behind nginx, disable response buffering so streaming and
            // Suspense work.
            { key: "X-Accel-Buffering", value: "no" },
            ...securityHeaders(isDev),
          ],
        },
      ]
    },
  }
}
