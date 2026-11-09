"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pending, setPending] = React.useState(false)

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        const { error } = await signOut()
        if (error) {
          setPending(false)
          toast.error(
            "Die Abmeldung hat nicht geklappt. Bitte erneut versuchen."
          )
          return
        }
        queryClient.clear()
        toast.success("Sie sind abgemeldet.")
        router.push("/sign-in")
        router.refresh()
      }}
    >
      {pending ? (
        <Spinner aria-hidden="true" />
      ) : (
        <LogOutIcon aria-hidden="true" />
      )}
      Abmelden
    </Button>
  )
}
