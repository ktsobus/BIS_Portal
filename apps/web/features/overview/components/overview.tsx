import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"

import {
  commands,
  extraComponents,
  features,
  featureTree,
  heroLogos,
  preconfigured,
  reasons,
  routes,
  shadcnComponents,
  springBootFit,
  stack,
  structure,
} from "../content"
import { logos } from "../logos"
import { DocsNav } from "./docs-nav"
import { LibraryCard } from "./library-card"
import { Logo, LogoTile } from "./logo"
import { ReasonCard } from "./reason-card"
import { Section, SubHeading } from "./section"

function title(name: string) {
  return name
    .split("-")
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ")
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.9em]">{children}</code>
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-muted p-4 font-mono text-sm">
      {children}
    </pre>
  )
}

type Primary = { href: string; label: string }

/**
 * Template overview: what the template contains and why. Rendered by
 * app/page.tsx; replace both with your own landing page.
 */
export function Overview({
  primary,
  setupDone,
}: {
  primary: Primary
  setupDone: boolean
}) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="mr-auto flex items-center gap-2 font-semibold">
            <Logo name="nextjs" />
            Next.js template
          </span>
          <Button size="sm" asChild>
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside>
          <DocsNav />
        </aside>

        <main className="flex min-w-0 flex-col gap-20 py-12">
          <Hero primary={primary} setupDone={setupDone} />
          <GettingStarted />
          <Stack />
          <Building />
          <Background />
        </main>
      </div>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-6 text-sm text-muted-foreground">
          <span className="mr-auto">
            See README.md for scripts and common tasks.
          </span>
          <Link href={primary.href} className="hover:text-foreground">
            {primary.label}
          </Link>
          {primary.href !== "/sign-in" && (
            <Link href="/sign-in" className="hover:text-foreground">
              Login
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}

function Hero({
  primary,
  setupDone,
}: {
  primary: Primary
  setupDone: boolean
}) {
  return (
    <section className="flex flex-col items-start gap-5">
      <Badge variant="secondary">pnpm · Turborepo · Next.js 16</Badge>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
        A full-stack Next.js monorepo, ready to build on
      </h1>
      <p className="max-w-2xl text-balance text-muted-foreground">
        Type-safe API, database, authentication with an admin section, optional
        TOTP and SAML, transactional email and every shadcn/ui component, wired
        together. This page explains what is included and why. It lives in{" "}
        <Code>apps/web/features/overview</Code>; replace it with your own
        landing page.
      </p>
      {!setupDone && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          No admin account exists yet. Create one at{" "}
          <Link href="/setup" className="font-medium underline">
            /setup
          </Link>{" "}
          to unlock the rest of the app.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={primary.href}>
            {primary.label}
            <ArrowRightIcon />
          </Link>
        </Button>
        {primary.href === "/dashboard" && (
          <Button variant="outline" asChild>
            <Link href="/sign-in">Login page</Link>
          </Button>
        )}
        <Button variant="ghost" asChild>
          <a href="#stack">Browse the stack</a>
        </Button>
      </div>
      <ul
        aria-label="Built with"
        className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2"
      >
        {heroLogos.map((name) => (
          <li key={name}>
            <Logo
              name={name}
              title={logos[name].title}
              className="size-6 opacity-80 transition-opacity hover:opacity-100"
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Press <Kbd>d</Kbd> to toggle dark mode.
      </p>
    </section>
  )
}

function GettingStarted() {
  return (
    <>
      <Section
        id="start"
        eyebrow="Getting started"
        title="Run it locally"
        description="Run these from the repo root, or open the repo in the dev container and run pnpm dev."
      >
        <Pre>{commands}</Pre>
        <p className="text-sm text-muted-foreground">
          Mailpit (captured emails) runs on{" "}
          <a
            href="http://localhost:8025"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            localhost:8025
          </a>
          . Email previews: <Code>pnpm email:dev</Code> on :3001. Database
          browser: <Code>pnpm db:studio</Code>.
        </p>
      </Section>

      <Section
        id="included"
        eyebrow="Getting started"
        title="What's included"
        description="Already wired up, so you can start with your own features."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {preconfigured.map(({ title, body, icon: Icon }) => (
            <Card key={title} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  {title}
                </CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="routes" eyebrow="Getting started" title="Routes">
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">What</th>
                <th className="px-3 py-2 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.path} className="border-t">
                  <td className="px-3 py-2 font-mono">
                    {route.path.includes("*") ? (
                      route.path
                    ) : (
                      <Link href={route.path} className="hover:underline">
                        {route.path}
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2">{route.description}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {route.access}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}

function Stack() {
  return (
    <>
      <Section
        id="stack"
        eyebrow="The stack"
        title="Overview"
        description={
          <>
            The template is built in layers. Each layer below lists its
            libraries (linked to their docs) and explains why they were chosen,
            compared with a typical SPA + Spring Boot setup.
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stack.map((layer) => (
            <a
              key={layer.id}
              href={`#${layer.id}`}
              className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Card
                size="sm"
                className="h-full transition-colors group-hover:bg-muted/50"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <layer.icon
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    {layer.title}
                  </CardTitle>
                  <CardDescription>{layer.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-wrap gap-1.5">
                  {layer.libraries.map((lib) => (
                    <LogoTile
                      key={lib.name}
                      name={lib.logos?.[0]}
                      icon={lib.icon}
                      className="size-7 [&_svg]:size-4"
                    />
                  ))}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      {stack.map((layer) => {
        const layerReasons = reasons.filter((r) => r.layer === layer.id)
        return (
          <Section
            key={layer.id}
            id={layer.id}
            eyebrow="The stack"
            title={layer.title}
            icon={layer.icon}
            description={layer.description}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {layer.libraries.map((lib) => (
                <LibraryCard key={lib.name} library={lib} />
              ))}
            </div>
            {layerReasons.length > 0 && (
              <div className="flex flex-col gap-3">
                <SubHeading>Why these choices</SubHeading>
                <div className="grid gap-3 md:grid-cols-2">
                  {layerReasons.map((reason) => (
                    <ReasonCard key={reason.title} reason={reason} />
                  ))}
                </div>
              </div>
            )}
          </Section>
        )
      })}
    </>
  )
}

function Building() {
  const structureReasons = reasons.filter((r) => r.layer === "structure")
  return (
    <>
      <Section
        id="structure"
        eyebrow="Building on it"
        title="Project structure"
        description="packages/api is the only shared package: it is the wire contract, so the client never imports server code."
      >
        <Pre>{structure}</Pre>
        <div className="grid gap-3 md:grid-cols-2">
          {structureReasons.map((reason) => (
            <ReasonCard key={reason.title} reason={reason} />
          ))}
        </div>
      </Section>

      <Section
        id="features"
        eyebrow="Building on it"
        title="Adding a feature"
        description="Each feature lives in apps/web/features/<name>. Its contract and schemas live in packages/api, one file per feature."
      >
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted-foreground marker:text-foreground/50">
          <li>
            Define the contract in{" "}
            <Code>packages/api/src/contracts/&lt;feature&gt;.ts</Code> (schemas
            in <Code>schemas/</Code>).
          </li>
          <li>
            Implement it in{" "}
            <Code>features/&lt;feature&gt;/server/router.ts</Code> and register
            it in <Code>server/router.ts</Code>.
          </li>
          <li>
            Build the UI in <Code>features/&lt;feature&gt;/components/</Code>{" "}
            and compose it in a thin page under <Code>app/</Code>.
          </li>
          <li>
            Add tables to <Code>db/schema/</Code> (one schema for all
            migrations) and emails to <Code>emails/</Code>.
          </li>
        </ol>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <SubHeading>Example: the tasks feature</SubHeading>
            <Pre>{featureTree}</Pre>
          </div>
          <div className="flex flex-col gap-3">
            <SubHeading>Existing features</SubHeading>
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Feature</th>
                    <th className="px-3 py-2 font-medium">Contains</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.name} className="border-t">
                      <td className="px-3 py-2 font-mono">{feature.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {feature.contains}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="components"
        eyebrow="Building on it"
        title="UI components"
        description="All installed in apps/web/components/ui. Import them as @/components/ui/<name>."
      >
        <Card size="sm">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              A few components rendered with the current theme.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Separator orientation="vertical" className="h-5" />
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
            <Input placeholder="Input" className="max-w-xs" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3">
          <SubHeading>shadcn/ui registry</SubHeading>
          <div className="flex flex-wrap gap-2">
            {shadcnComponents.map((name) => (
              <Badge key={name} variant="outline" asChild>
                <a
                  href={`https://ui.shadcn.com/docs/components/${name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {title(name)}
                </a>
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SubHeading>Chat and AI building blocks</SubHeading>
          <div className="flex flex-wrap gap-2">
            {extraComponents.map((name) => (
              <Badge key={name} variant="secondary">
                {title(name)}
              </Badge>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}

function Background() {
  return (
    <Section
      id="spring-boot"
      eyebrow="Background"
      title="When SPA + Spring Boot still fits"
      description="Every reason above compares this template with a separate SPA and a Spring Boot API. That setup is still the better choice in some cases."
    >
      <p className="max-w-3xl rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {springBootFit}
      </p>
    </Section>
  )
}
