"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pending, setPending] = React.useState(false)

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 type-nav-meta text-secondary transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-6 [&_svg]:text-primary"
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
      Abmelden
      {pending ? (
        <Spinner aria-hidden="true" />
      ) : (
        <LogOutIcon aria-hidden="true" strokeWidth={1.5} />
      )}
    </button>
  )
}
