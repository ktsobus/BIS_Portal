"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { CircleAlert, CircleCheck, X } from "lucide-react"
import { Toast as Primitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface ToastInput {
  title: string
  description?: string
  tone?: "ok" | "error"
}

interface ToastItem extends ToastInput {
  id: number
}

let nextId = 0

const ToastContext = createContext<(toast: ToastInput) => void>(() => {})

/** Meldet das Ergebnis einer Aktion, ohne den Arbeitsfluss zu unterbrechen. */
export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((input: ToastInput) => {
    setItems((current) => [...current, { ...input, id: nextId++ }])
  }, [])

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      <Primitive.Provider label="Meldung" duration={6000}>
        {children}
        {items.map((item) => {
          const error = item.tone === "error"
          const Icon = error ? CircleAlert : CircleCheck
          return (
            <Primitive.Root
              key={item.id}
              type={error ? "foreground" : "background"}
              onOpenChange={(open) => {
                if (!open) {
                  setItems((current) =>
                    current.filter((entry) => entry.id !== item.id)
                  )
                }
              }}
              className={cn(
                "flex items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm data-[state=open]:animate-rise-in",
                error ? "border-red" : "border-ink"
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-[1.125rem] shrink-0",
                  error ? "text-red" : "text-green-strong"
                )}
              />
              <div className="min-w-0 flex-1">
                <Primitive.Title className="font-bold text-ink">
                  {item.title}
                </Primitive.Title>
                {item.description ? (
                  <Primitive.Description className="mt-0.5 text-text">
                    {item.description}
                  </Primitive.Description>
                ) : null}
              </div>
              <Primitive.Close
                aria-label="Meldung schliessen"
                className="-mt-1 -mr-2 grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-ground hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </Primitive.Close>
            </Primitive.Root>
          )
        })}
        <Primitive.Viewport className="fixed right-0 bottom-0 z-[60] flex w-full max-w-md flex-col gap-2 p-4 outline-none" />
      </Primitive.Provider>
    </ToastContext.Provider>
  )
}
