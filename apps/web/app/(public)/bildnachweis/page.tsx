import type { Metadata } from "next"

import { CatalogFrame } from "@/features/catalog/components/page-frame"

export const metadata: Metadata = {
  title: "Bildnachweis",
  description:
    "Urheber und Lizenzen der Fotografien auf dem BITS-Portal (Wikimedia Commons).",
}

/*
 * Die Fotografien stammen von Wikimedia Commons (public/assets/img,
 * credits.json). Das CD-Manual verlangt die Nennung der Fotografen; die
 * Lizenzen CC BY-SA verlangen Urheber, Lizenz und Hinweis auf Änderungen.
 */
const photos = [
  {
    title: "Portal des Rathauses Solothurn",
    where: "Startseite, erster Bildschirm",
    by: "Tilman2007",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Barf%C3%BCssergasse_24,_Rathaus_Solothurn_20240331_0173.jpg",
  },
  {
    title: "Rathaus Solothurn, Ansicht Rathausgasse",
    where: "Startseite, Kategorien und Menü",
    by: "Tilman2007",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Barf%C3%BCssergasse_24,_Rathaus,_Ansicht_Rathausgasse_Solothurn_20240331_0165.jpg",
  },
  {
    title: "Altstadt Solothurn, Panorama",
    where: "Startseite, Abschluss",
    by: "Wladyslaw, zusammengesetzt von David W.",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    page: "https://commons.wikimedia.org/wiki/File:Solothurn_Altstadt_Panorama.jpg",
  },
]

export default function CreditsPage() {
  return (
    <CatalogFrame>
      <div className="wrap">
        <div className="page-head">
          <h1>Bildnachweis</h1>
          <p className="t-lead">
            Die Fotografien stammen von Wikimedia Commons. Sie sind für das
            Portal zugeschnitten und verkleinert, sonst unverändert.
          </p>
        </div>
      </div>
      <div className="wrap">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Bild</th>
                <th scope="col">Urheber</th>
                <th scope="col">Lizenz</th>
                <th scope="col">Quelle</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => (
                <tr key={photo.page}>
                  <td>
                    {photo.title}
                    <small>{photo.where}</small>
                  </td>
                  <td>{photo.by}</td>
                  <td className="linklist">
                    <a
                      href={photo.licenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ext"
                    >
                      {photo.licence}
                    </a>
                  </td>
                  <td className="linklist">
                    <a
                      href={photo.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ext"
                    >
                      Wikimedia Commons
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CatalogFrame>
  )
}
