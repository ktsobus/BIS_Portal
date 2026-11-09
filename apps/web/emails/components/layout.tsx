import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "react-email"
import type * as React from "react"

export function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-neutral-50 font-sans">
          <Container className="mx-auto my-10 max-w-[480px] rounded-lg border border-solid border-neutral-200 bg-white p-8">
            {children}
            <Section className="mt-8">
              <Text className="text-xs text-neutral-500">
                You received this email because an action was taken on your
                account. If this wasn&apos;t you, you can safely ignore it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
