"use client"

import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const queryClient = useQueryClient()
  const [pending, setPending] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  return (
    <>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setFailed(false)
          const { error } = await signOut()
          if (error) {
            setPending(false)
            setFailed(true)
            return
          }
          queryClient.clear()
          // Ganze Seite laden; die Anmeldeseite bestätigt die Abmeldung.
          window.location.assign("/sign-in?signedOut=1")
        }}
      >
        {pending ? "Abmeldung läuft …" : "Abmelden"}
      </button>
      <p role="status" className="admin-account__status">
        {failed
          ? "Die Abmeldung hat nicht geklappt. Bitte erneut versuchen."
          : null}
      </p>
    </>
  )
}
