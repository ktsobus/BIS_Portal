"use client"

import { CopyIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CopyField({ label, value }: { label: string; value: string }) {
  const id = React.useId()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className="font-mono text-sm" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`${label} kopieren`}
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success("In die Zwischenablage kopiert"))
              .catch(() =>
                toast.error("Kopieren nicht möglich. Bitte manuell markieren.")
              )
          }
        >
          <CopyIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
