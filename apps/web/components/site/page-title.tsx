// PHASE-0-STUB (Besitz: öffentliche UI). Signatur beibehalten.
/** Seitentitel mit rotem Quadrat gemäss CD-Manual. */
export function PageTitle({
  children,
  eyebrow,
}: {
  children: React.ReactNode
  /** Kleine Zeile über dem Titel, z. B. die Service-Familie. */
  eyebrow?: React.ReactNode
}) {
  return (
    <div>
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h1>{children}</h1>
    </div>
  )
}
