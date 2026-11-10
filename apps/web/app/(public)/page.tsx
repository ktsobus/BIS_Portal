import { ActionBar } from "@/components/shell/site-footer"
import { SiteNav } from "@/components/shell/site-nav"
import {
  HomeCategories,
  HomeClosing,
  HomeHero,
  HomeStatement,
  HomeSteps,
} from "@/features/catalog/components/home"
import { loadShell, loadShowcase } from "@/features/catalog/load"

export default async function HomePage() {
  const [shell, showcase] = await Promise.all([loadShell(), loadShowcase()])
  return (
    <>
      <SiteNav families={shell.families} leistungen={shell.leistungen} />
      <main id="top">
        <HomeHero shell={shell} />
        <HomeCategories shell={shell} />
        <HomeSteps showcase={showcase} />
        <HomeStatement />
      </main>
      <HomeClosing shell={shell} />
      <ActionBar />
    </>
  )
}
