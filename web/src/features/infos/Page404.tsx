import { BoutonLien } from '@/design-system'

export function Page404() {
  return (
    // cloneme: C-24 — pages d'état (404, confirmation) au vocabulaire de l'appel final de la référence : chiffre géant en creux, titre plein, texte gris, boutons pilule.
    <section className="conteneur flex min-h-[80vh] flex-col items-center justify-center pt-20 text-center">
      <p aria-hidden className="contour-encre font-display uppercase leading-[0.86] tracking-[-0.025em]" style={{ fontSize: 'clamp(96px, 18vw, 220px)' }}>404</p>
      <p className="surtitre mt-6 text-gris">Erreur 404</p>
      <h1 className="font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em]">Cette page s'est éclipsée</h1>
      <p className="mt-5 max-w-md text-[15px] leading-[1.55] text-gris">Le lien est peut-être incomplet, ou la pièce n'est plus présentée.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <BoutonLien to="/boutique">La boutique</BoutonLien>
        <BoutonLien to="/" variante="contour">Accueil</BoutonLien>
      </div>
    </section>
  )
}
