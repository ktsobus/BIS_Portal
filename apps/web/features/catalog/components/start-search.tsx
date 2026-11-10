import Form from "next/form"

import { SearchFieldLarge } from "./search-field-large"

/** Grosses Suchfeld der Startseite; sendet an `/suche?q=…`. */
export function StartSearch() {
  return (
    <Form
      action="/suche"
      role="search"
      aria-labelledby="start-suche-titel"
      className="flex flex-col gap-3"
    >
      <h2 id="start-suche-titel" className="type-headline-md">
        Was benötigen Sie?
      </h2>
      <SearchFieldLarge
        id="start-suche"
        name="q"
        label="Services und Leistungen suchen"
        placeholder="Suche nach Services und Leistungen"
        aria-describedby="start-suche-hinweis"
      />
      <p id="start-suche-hinweis" className="type-body-sm">
        Durchsucht Leistungen, Services, Anwendungen und verantwortliche
        Stellen.
      </p>
    </Form>
  )
}
