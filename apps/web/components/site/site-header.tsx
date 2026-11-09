// PHASE-0-STUB (Besitz: öffentliche UI). Signatur beibehalten.
export function SiteHeader({
  variant = "public",
}: {
  /** `admin` zeigt zusätzlich die Admin-Kennzeichnung. */
  variant?: "public" | "admin"
}) {
  return <header data-variant={variant}>BITS-Portal</header>
}
