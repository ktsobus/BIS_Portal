"use client"

import * as React from "react"

/**
 * Modaler Dialog auf dem nativen `<dialog>`: `open` steuert `showModal()` und
 * `close()`. Escape und ein Klick neben den Dialog schliessen ihn; beides
 * meldet `onClose`. Der Inhalt wird nur gerendert, solange der Dialog offen
 * ist, damit Formulare beim nächsten Öffnen leer beginnen.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  React.useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        // Escape: React-Zustand führt, der Effekt oben schliesst den Dialog.
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open ? (
        <div className="dialog__body">
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
