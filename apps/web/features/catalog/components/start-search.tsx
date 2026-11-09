import Form from "next/form"
import { SearchIcon } from "lucide-react"

/** Grosses Suchfeld der Startseite; sendet an `/suche?q=…`. */
export function StartSearch() {
  return (
    <Form
      action="/suche"
      role="search"
      aria-labelledby="start-suche-label"
      className="flex max-w-[44rem] flex-col gap-2"
    >
      <label
        id="start-suche-label"
        htmlFor="start-suche"
        className="text-xl leading-tight"
      >
        Was benötigen Sie?
      </label>
      <div className="flex items-stretch">
        <input
          id="start-suche"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="z. B. eLearning, Telefonie, Zugang"
          aria-describedby="start-suche-hinweis"
          className="h-12 min-w-0 flex-1 border border-r-0 border-input bg-background px-3 text-lg placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 border border-primary bg-primary px-4 text-lg font-bold text-primary-foreground hover:border-foreground hover:bg-foreground sm:px-5"
        >
          <SearchIcon aria-hidden="true" className="size-5" />
          <span className="sr-only sm:not-sr-only">Suchen</span>
        </button>
      </div>
      <p id="start-suche-hinweis" className="text-sm text-muted-foreground">
        Durchsucht Leistungen, Services, Anwendungen und verantwortliche
        Stellen.
      </p>
    </Form>
  )
}
