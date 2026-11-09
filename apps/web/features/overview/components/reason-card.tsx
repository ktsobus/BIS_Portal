import { ExternalLinkIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Reason } from "../content"

/** Why a part of the stack was chosen, compared with SPA + Spring Boot. */
export function ReasonCard({ reason }: { reason: Reason }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{reason.title}</CardTitle>
        <CardDescription>{reason.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <ul className="flex list-disc flex-col gap-1.5 pl-4 text-muted-foreground marker:text-foreground/30">
          {reason.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {reason.comparison && (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="mb-1 text-xs font-medium tracking-wide text-foreground/70 uppercase">
              vs. SPA + Spring Boot
            </p>
            <p className="text-muted-foreground">{reason.comparison}</p>
          </div>
        )}
        {reason.docs && (
          <a
            href={reason.docs.href}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {reason.docs.label}
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}
