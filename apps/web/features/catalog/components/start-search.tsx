import Form from "next/form"

import { SearchFieldLarge } from "./search-field-large"

/** Grosses Suchfeld der Startseite; sendet an `/suche?q=…`. */
export function StartSearch() {
  return (
    <Form action="/suche" role="search" aria-label="Katalog durchsuchen">
      <SearchFieldLarge
        id="start-suche"
        name="q"
        label="Suchbegriff"
        placeholder="Suche nach Leistungen"
      />
    </Form>
  )
}
