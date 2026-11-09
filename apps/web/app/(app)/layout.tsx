import { requireSetupComplete } from "@/lib/setup"

/** Every page except /setup lives here and is unreachable until setup is done. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSetupComplete()
  return children
}
