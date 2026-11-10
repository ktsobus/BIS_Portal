/**
 * Kopf einer Verwaltungsseite: Titel, ein Satz dazu und rechts die eine
 * Hauptaktion der Seite (z. B. «Admin-Konto erfassen»).
 */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="wrap">
      <div className="admin-head">
        <div className="page-head">
          <h1>{title}</h1>
          <p className="t-lead">{description}</p>
        </div>
        {action ? <div className="admin-head__action">{action}</div> : null}
      </div>
    </div>
  )
}
