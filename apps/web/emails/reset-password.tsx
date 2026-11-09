import { Button, Heading, Text } from "react-email"

import { EmailLayout } from "./components/layout"

export interface ResetPasswordProps {
  name: string
  url: string
}

export default function ResetPassword({ name, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading className="text-2xl font-semibold text-neutral-900">
        Reset your password
      </Heading>
      <Text className="text-neutral-700">Hi {name},</Text>
      <Text className="text-neutral-700">
        We received a request to reset your password. This link expires in one
        hour.
      </Text>
      <Button
        href={url}
        className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
      >
        Reset password
      </Button>
    </EmailLayout>
  )
}

ResetPassword.PreviewProps = {
  name: "Ada",
  url: "http://localhost:3000/reset-password?token=example",
} satisfies ResetPasswordProps
