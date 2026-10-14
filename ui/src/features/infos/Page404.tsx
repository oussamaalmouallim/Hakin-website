import { BoutonLien, Monogramme } from '@/design-system'

export function Page404() {
  return (
    <section className="conteneur flex min-h-[80vh] flex-col items-center justify-center pt-[var(--nav-h)] text-center">
      <Monogramme className="h-16 opacity-80" />
      <p className="label mt-8 text-bronze">Erreur 404</p>
      <h1 className="titre-1 mt-4">Cette page s'est éclipsée</h1>
      <p className="mt-5 max-w-md text-gris">Le lien est peut-être incomplet, ou la pièce n'est plus présentée.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <BoutonLien to="/boutique">La boutique</BoutonLien>
        <BoutonLien to="/" variante="contour">Accueil</BoutonLien>
      </div>
    </section>
  )
}
