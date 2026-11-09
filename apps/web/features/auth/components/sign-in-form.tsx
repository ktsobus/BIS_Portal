"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { orpc } from "@/lib/orpc"
import { safeRedirectPath } from "@/lib/safe-redirect"

import { PasswordSignInForm } from "./password-sign-in-form"
import { SsoSignIn } from "./sso-sign-in"

export function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"))
  const methods = useQuery(orpc.auth.methods.queryOptions())
  const error = searchParams.get("error")

  React.useEffect(() => {
    if (error) toast.error("Single sign-on failed. Please try again.")
  }, [error])

  const tabs = [
    {
      value: "password",
      label: "Password",
      content: <PasswordSignInForm callbackUrl={callbackUrl} />,
    },
    ...(methods.data?.sso
      ? [
          {
            value: "sso",
            label: "SSO",
            content: <SsoSignIn callbackUrl={callbackUrl} />,
          },
        ]
      : []),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back.</CardDescription>
      </CardHeader>
      <CardContent>
        {tabs.length === 1 ? (
          tabs[0]!.content
        ) : (
          <Tabs defaultValue="password">
            <TabsList className="w-full">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.value} value={t.value} className="pt-4">
                {t.content}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          No account? Ask an administrator to create one.
        </p>
      </CardFooter>
    </Card>
  )
}
