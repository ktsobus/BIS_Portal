import "server-only"

import { render } from "@react-email/render"
import nodemailer from "nodemailer"
import type * as React from "react"

import ResetPassword, { type ResetPasswordProps } from "@/emails/reset-password"
import VerifyEmail, { type VerifyEmailProps } from "@/emails/verify-email"
import { env } from "@/lib/env"

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    : undefined,
})

/** Renders a React Email template to HTML + plain text and sends it. */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ])
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html, text })
}

export function sendVerifyEmail(to: string, props: VerifyEmailProps) {
  return sendEmail({
    to,
    subject: "Verify your email address",
    react: <VerifyEmail {...props} />,
  })
}

export function sendResetPasswordEmail(to: string, props: ResetPasswordProps) {
  return sendEmail({
    to,
    subject: "Reset your password",
    react: <ResetPassword {...props} />,
  })
}
