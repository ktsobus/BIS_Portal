"use client"

import { useQuery } from "@tanstack/react-query"
import { CircleAlertIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { PageTitle } from "@/components/site/page-title"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"
import { safeRedirectPath } from "@/lib/safe-redirect"

import { PasswordSignInForm } from "./password-sign-in-form"
import { SsoSignIn } from "./sso-sign-in"

/** Meldung zu `?error=…` nach einer fehlgeschlagenen SSO-Anmeldung. */
function ssoErrorMessage(code: string) {
  return errorMessage(
    { code },
    {},
    "Die Anmeldung über SSO ist fehlgeschlagen. Bitte versuchen Sie es erneut oder wenden Sie sich an den Service Desk."
  )
}

export function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"))
  const methods = useQuery(orpc.auth.methods.queryOptions())
  const error = searchParams.get("error")

  const tabs = [
    {
      value: "password",
      label: "Passwort",
      content: <PasswordSignInForm callbackUrl={callbackUrl} />,
    },
    ...(methods.data?.sso
      ? [
          {
            value: "sso",
            label: "SSO (SAML)",
            content: <SsoSignIn callbackUrl={callbackUrl} />,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <PageTitle>Anmelden</PageTitle>
        <p className="text-muted-foreground">
          Die Anmeldung ist nur für die Administration des Portals nötig. Der
          Katalog ist ohne Anmeldung zugänglich.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="p-4">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle className="text-base font-bold">
            Anmeldung nicht möglich
          </AlertTitle>
          <AlertDescription className="text-foreground!">
            {ssoErrorMessage(error)}
          </AlertDescription>
        </Alert>
      ) : null}

      {tabs.length === 1 ? (
        tabs[0]!.content
      ) : (
        <Tabs defaultValue="password" className="gap-6">
          <TabsList className="w-full">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              {t.content}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
        Noch kein Konto? Konten werden von den Admins im Admin-Bereich erfasst.
      </p>
    </div>
  )
}
