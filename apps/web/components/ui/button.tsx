import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * Schaltflächen nach docs/design.md: immer Pillen (Text) oder Kreise
 * (Symbol), 16-px-Beschriftung im Normalschnitt, Symbol 22 px mit
 * 0,35 em Abstand. Beim Überfahren und Drücken sinken sie ein (Innenschatten),
 * sie heben sich nie.
 */
const buttonCva = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-[0.35em] rounded-full border border-transparent bg-clip-padding text-base leading-5 font-normal whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150 ease-in-out select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.375rem]",
  {
    variants: {
      variant: {
        /** Primär: rote Pille für die eine Hauptaktion eines Abschnitts. */
        default:
          "bg-primary text-primary-foreground hover:shadow-press-dark active:shadow-press-dark aria-expanded:shadow-press-dark",
        /** Standard: weisse Pille mit Haarlinie, Symbol rot. */
        outline:
          "border-hairline bg-background text-secondary hover:shadow-press-light active:shadow-press-light aria-expanded:shadow-press-light [&_svg]:text-primary",
        /** Sekundär: Schiefer, beim Überfahren heller. */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-slate-light active:shadow-press-dark aria-expanded:bg-slate-light",
        /** Grauer Chip (Filter): beim Überfahren und gewählt rot. */
        chip: "border-hairline bg-tile-teaser text-secondary hover:border-primary hover:bg-primary hover:text-primary-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        /** Ohne Fläche, z. B. Werkzeuge in Tabellen. */
        ghost:
          "text-secondary hover:bg-tile-teaser active:shadow-press-light aria-expanded:bg-tile-teaser [&_svg]:text-primary",
        /** Bestätigung einer löschenden Aktion: wie Primär (Rot = Aktion). */
        destructive:
          "bg-primary text-primary-foreground hover:shadow-press-dark active:shadow-press-dark",
        /** Auf der Schieferfläche (Fusszeile). */
        "on-dark":
          "border-steel bg-transparent text-white hover:shadow-press-dark active:shadow-press-dark",
        link: "h-auto rounded-none px-0 text-secondary underline decoration-1 underline-offset-[0.2em] transition-colors duration-200 hover:text-primary",
      },
      size: {
        default:
          "h-[3.125rem] px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        lg: "h-[3.25rem] px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        sm: "h-[2.625rem] px-5 text-sm leading-[1.125rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        xs: "h-9 gap-1 px-3.5 text-sm leading-[1.125rem] [&_svg:not([class*='size-'])]:size-4",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-5",
        "icon-lg": "size-[3.25rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Klassen einer Schaltfläche, zusammengeführt (`cn`), damit z. B. die
 * Rahmenfarbe einer Variante die transparente Grundlinie sicher ersetzt –
 * auch wenn Links die Klassen direkt verwenden.
 */
function buttonVariants(props?: Parameters<typeof buttonCva>[0]) {
  return cn(buttonCva(props))
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonCva> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
