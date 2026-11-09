import { Overview } from "@/features/overview/components/overview"
import { getSession } from "@/lib/session"
import { isSetupComplete } from "@/lib/setup"

/**
 * Template overview. Lives outside the (app) group so it is reachable before
 * /setup has been completed. Replace it with your own landing page.
 */
export default async function Page() {
  const [setupDone, session] = await Promise.all([
    isSetupComplete(),
    getSession(),
  ])

  const primary = !setupDone
    ? { href: "/setup", label: "Create the first admin" }
    : session
      ? { href: "/dashboard", label: "Go to dashboard" }
      : { href: "/sign-in", label: "Sign in" }

  return <Overview primary={primary} setupDone={setupDone} />
}
