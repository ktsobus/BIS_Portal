/** Only allow same-origin relative paths, to avoid open redirects. */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/admin"
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }
  return value
}
