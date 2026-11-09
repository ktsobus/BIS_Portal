import type { UserRole } from "@workspace/api"

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  user: "Benutzer",
}

/** Anmeldeart: `credential` = Passwort, sonst die ID des SAML-Providers. */
export function signInMethodLabel(providerId: string): string {
  return providerId === "credential" ? "Passwort" : `SAML: ${providerId}`
}
