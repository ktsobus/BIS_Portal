"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { Notice } from "@/components/ui/notice"
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

/**
 * Anmeldeseite: links das Passwort-Formular und, wenn ein SAML-Provider
 * eingerichtet ist, darunter die Anmeldung über SSO; rechts, wer ein Konto
 * braucht und woher es kommt.
 */
export function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"))
  const methods = useQuery(orpc.auth.methods.queryOptions())
  const error = searchParams.get("error")
  const signedOut = searchParams.get("signedOut") === "1"

  return (
    <div className="wrap">
      <div className="grid grid--top auth">
        <div className="span-5 auth__main">
          <div className="page-head">
            <h1>Anmelden</h1>
            <p className="t-lead">
              Die Anmeldung ist nur für die Administration des Portals nötig.
              Der Katalog ist ohne Anmeldung zugänglich.
            </p>
          </div>

          {error ? (
            <Notice title="Anmeldung nicht möglich" bad role="alert">
              <p>{ssoErrorMessage(error)}</p>
            </Notice>
          ) : signedOut ? (
            <Notice title="Sie sind abgemeldet." role="status" />
          ) : null}

          <PasswordSignInForm callbackUrl={callbackUrl} />

          {methods.data?.sso ? (
            <section className="auth__sso" aria-labelledby="sso-h">
              <div className="block-head">
                <h2 id="sso-h">Mit SSO anmelden</h2>
              </div>
              <SsoSignIn callbackUrl={callbackUrl} />
            </section>
          ) : null}
        </div>

        <aside className="span-4 start-9 aside-card">
          <h2>Noch kein Konto?</h2>
          <p>Konten werden von den Admins im Admin-Bereich erfasst.</p>
        </aside>
      </div>
    </div>
  )
}
