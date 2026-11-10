"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  return (
    <Button
      size="sm"
      loading={pending}
      className={className}
      onClick={async () => {
        setPending(true)
        try {
          await authClient.signOut()
        } finally {
          router.push("/sign-in")
          router.refresh()
        }
      }}
    >
      {pending ? null : <LogOut aria-hidden="true" />}
      Abmelden
    </Button>
  )
}
