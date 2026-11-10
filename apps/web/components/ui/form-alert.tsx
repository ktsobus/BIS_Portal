import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Bleibender Fehlerhinweis über einem Formular (z. B. falsches Passwort,
 * Serverfehler). Anders als ein Toast verschwindet er nicht von selbst und
 * lässt sich per `id` mit den Feldern verknüpfen (`aria-describedby`).
 */
export function FormAlert({
  id,
  title,
  children,
  ref,
}: {
  id: string
  title: string
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <Alert
      ref={ref}
      id={id}
      variant="destructive"
      tabIndex={-1}
      className="p-4 outline-none"
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle className="text-base font-bold">{title}</AlertTitle>
      <AlertDescription className="text-foreground!">
        {children}
      </AlertDescription>
    </Alert>
  )
}
