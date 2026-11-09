import { z } from "zod"

/**
 * Deutsche Meldungen für Admin- und Anmeldeseiten.
 *
 * Die Contracts in `@workspace/api` und better-auth liefern englische
 * Fehlermeldungen. Die Oberfläche zeigt sie nie direkt an, sondern übersetzt
 * sie anhand des stabilen Fehlercodes.
 */

/** Meldungen zu oRPC-Fehlercodes, die jede Admin-Prozedur liefern kann. */
const orpcMessages: Record<string, string> = {
  UNAUTHORIZED: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  TWO_FACTOR_REQUIRED:
    "Bitte richten Sie zuerst die Zwei-Faktor-Authentisierung ein.",
  FORBIDDEN: "Für diese Aktion sind Adminrechte nötig.",
  NOT_FOUND: "Der Eintrag wurde nicht gefunden.",
  BAD_REQUEST: "Die Eingaben sind ungültig.",
  TOO_MANY_REQUESTS:
    "Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
  INTERNAL_SERVER_ERROR:
    "Auf dem Server ist ein Fehler aufgetreten. Details stehen im Server-Protokoll.",
}

/** Meldungen zu better-auth-Fehlercodes (Anmeldung, Zwei-Faktor, Admin). */
const authMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch.",
  INVALID_EMAIL: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  INVALID_PASSWORD: "Das Passwort ist falsch.",
  USER_NOT_FOUND: "Das Benutzerkonto wurde nicht gefunden.",
  EMAIL_NOT_VERIFIED: "Die E-Mail-Adresse ist noch nicht bestätigt.",
  BANNED_USER: "Dieses Benutzerkonto ist gesperrt.",
  SESSION_EXPIRED:
    "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  INVALID_CODE: "Der Code ist ungültig. Bitte versuchen Sie es erneut.",
  INVALID_BACKUP_CODE: "Der Backup-Code ist ungültig.",
  OTP_HAS_EXPIRED: "Der Code ist abgelaufen.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE:
    "Zu viele Versuche. Bitte melden Sie sich erneut an.",
  ACCOUNT_TEMPORARILY_LOCKED:
    "Zu viele Fehlversuche. Das Konto ist vorübergehend gesperrt. Bitte versuchen Sie es später erneut.",
  INVALID_TWO_FACTOR_COOKIE:
    "Die Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an.",
  TOTP_ALREADY_ENABLED:
    "Die Zwei-Faktor-Authentisierung ist bereits eingerichtet.",
  YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE:
    "Sie dürfen die Rolle dieses Benutzers nicht ändern.",
  CANNOT_CHANGE_OWN_ROLE: "Sie können Ihre eigene Rolle nicht ändern.",
  ADMIN_ACCOUNT_LINK_FORBIDDEN:
    "Diese E-Mail-Adresse gehört zu einem Admin-Konto mit Passwort. Bitte melden Sie sich mit dem Passwort an.",
}

const statusMessages: Record<number, string> = {
  401: orpcMessages.UNAUTHORIZED!,
  403: orpcMessages.FORBIDDEN!,
  429: orpcMessages.TOO_MANY_REQUESTS!,
}

export const GENERIC_ERROR_MESSAGE =
  "Das hat nicht geklappt. Bitte versuchen Sie es erneut."

function readField(error: unknown, field: "code" | "status") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return undefined
  }
  return (error as Record<string, unknown>)[field]
}

/**
 * Deutsche Meldung zu einem Fehler aus oRPC oder better-auth.
 *
 * `messages` übersteuert die Meldung je Fehlercode (z. B. `CONFLICT` einer
 * bestimmten Prozedur); `fallback` gilt für unbekannte Fehler.
 */
export function errorMessage(
  error: unknown,
  messages: Record<string, string> = {},
  fallback = GENERIC_ERROR_MESSAGE
): string {
  const code = readField(error, "code")
  if (typeof code === "string") {
    const message = messages[code] ?? authMessages[code] ?? orpcMessages[code]
    if (message) return message
  }
  const status = readField(error, "status")
  if (typeof status === "number" && statusMessages[status]) {
    return statusMessages[status]
  }
  // fetch() wirft einen TypeError, wenn der Server nicht erreichbar ist.
  if (error instanceof TypeError) {
    return "Der Server ist nicht erreichbar. Bitte prüfen Sie die Verbindung."
  }
  return fallback
}

/**
 * Formularfelder für Benutzerkonten mit deutschen Meldungen. Die Regeln
 * entsprechen `setupAdminInputSchema` / `createUserInputSchema` in
 * `@workspace/api` (der Server prüft zusätzlich mit diesen).
 */
export const accountFields = {
  name: z
    .string()
    .trim()
    .min(1, "Bitte geben Sie einen Namen ein.")
    .max(100, "Der Name darf höchstens 100 Zeichen lang sein."),
  email: z.email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(12, "Das Passwort muss mindestens 12 Zeichen lang sein.")
    .max(128, "Das Passwort darf höchstens 128 Zeichen lang sein."),
}
