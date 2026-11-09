"use client"

import * as React from "react"

function hide(img: HTMLImageElement) {
  img.style.visibility = "hidden"
}

/**
 * Logo des Kantons als Originaldatei. Fehlt die Datei, bleibt der Platz leer
 * (CD-Manual: kein Ersatzschriftzug, kein Symbol für ein defektes Bild).
 */
export function BrandLogo({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const ref = React.useRef<HTMLImageElement>(null)

  // Fehler, die vor der Hydration auftreten, erreichen onError nicht mehr.
  React.useEffect(() => {
    const img = ref.current
    if (img?.complete) img.decode().catch(() => hide(img))
  }, [])

  return (
    // Bewusst <img>: Originaldatei ohne Bildoptimierung.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => hide(event.currentTarget)}
    />
  )
}
