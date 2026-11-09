import { Button, Heading, Text } from "react-email"

import { EmailLayout } from "./components/layout"

export interface VerifyEmailProps {
  name: string
  url: string
}

export default function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Heading className="text-2xl font-semibold text-neutral-900">
        Verify your email
      </Heading>
      <Text className="text-neutral-700">Hi {name},</Text>
      <Text className="text-neutral-700">
        Please confirm your email address by clicking the button below.
      </Text>
      <Button
        href={url}
        className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
      >
        Verify email
      </Button>
    </EmailLayout>
  )
}

VerifyEmail.PreviewProps = {
  name: "Ada",
  url: "http://localhost:3000/api/auth/verify-email?token=example",
} satisfies VerifyEmailProps
