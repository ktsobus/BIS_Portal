"use client"

import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await signOut()
        queryClient.clear()
        router.push("/sign-in")
        router.refresh()
      }}
    >
      <LogOutIcon />
      Sign out
    </Button>
  )
}
