import { stack } from "../content"

export const navGroups: {
  title: string
  items: [id: string, label: string][]
}[] = [
  {
    title: "Getting started",
    items: [
      ["start", "Run it locally"],
      ["included", "What's included"],
      ["routes", "Routes"],
    ],
  },
  {
    title: "The stack",
    items: [
      ["stack", "Overview"],
      ...stack.map((layer): [string, string] => [layer.id, layer.title]),
    ],
  },
  {
    title: "Building on it",
    items: [
      ["structure", "Project structure"],
      ["features", "Adding a feature"],
      ["components", "UI components"],
    ],
  },
  {
    title: "Background",
    items: [["spring-boot", "vs. SPA + Spring Boot"]],
  },
]

/** Sticky table of contents shown next to the content on large screens. */
export function DocsNav() {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 hidden max-h-[calc(100svh-3.5rem)] flex-col gap-6 overflow-y-auto py-12 pr-4 text-sm lg:flex"
    >
      {navGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          {group.items.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      ))}
    </nav>
  )
}
