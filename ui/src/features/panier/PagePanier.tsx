import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { BoutonLien, EtatVide, ImageProduit, PastilleCouleur, Quantite, useNotifier } from '@/design-system'
import { boutique, estPackshot } from '@/lib/catalogue'
import { formatDH } from '@/lib/format'
import { lignesDetaillees, nbArticles, sousTotal, usePanier } from '@/state/panier'
import { EASE_MAISON } from '@/lib/animations'

const lienRetour = 'mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gris transition-colors hover:text-encre'
const detail = 'font-mono text-[10px] uppercase tracking-[0.16em] text-gris'

/** cloneme: P-06 — panier, sur la mise en page du checkout de la référence (P-05) : lien retour mono, titre 32 px,
 *  grille 1fr / 440 px dès 1024 px ; articles en cartes `--fond-2` rayon 20 px (vignette 120 px, détail mono, quantité en pilule,
 *  total de ligne Archivo Black) ; récapitulatif noir collant C-29 avec encart jaune et bouton jaune « Commander ».
 *  La référence n'a pas de page panier (tiroir seulement, C-06) : composition Approximée à partir de ses composants. */
export function PagePanier() {
  const { lignes, changerQuantite, retirer, restaurer } = usePanier()
  const notifier = useNotifier()
  const details = lignesDetaillees(lignes)
  const nb = nbArticles(details)
  const total = sousTotal(lignes)
  const frais = boutique.livraison.fraisDH

  return (
    <div className="min-h-screen pt-20">
      <div className="px-5 pb-16 pt-8 md:px-14">
        <Link to="/boutique" className={lienRetour}><ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />Continuer mes achats</Link>
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-[32px] uppercase leading-[1.5] tracking-[0.02em]">Panier</h1>
          {details.length > 0 && <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gris" aria-live="polite">{nb} article{nb > 1 ? 's' : ''}</p>}
        </div>

        {!details.length ? (
          <EtatVide titre="Votre panier est vide" texte="Les pièces que vous ajouterez apparaîtront ici." icone={<ShoppingBag className="h-8 w-8" strokeWidth={1} />}
            action={<BoutonLien to="/boutique">Découvrir la boutique</BoutonLien>} />
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_440px]">
            <ul className="flex min-w-0 flex-col gap-4">
              <AnimatePresence initial={false}>
                {details.map(l => (
                  <motion.li key={l.cle} layout exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: EASE_MAISON }}
                    className="flex gap-4 rounded-carte bg-fond-2 p-4 sm:gap-6 sm:p-5">
                    <Link to={`/produit/${l.slug}`} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-bloc bg-fond sm:w-[120px]">
                      <ImageProduit src={l.produit.images[0].src} alt={l.produit.images[0].alt} packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="120px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className={detail}>{l.produit.marque}</p>
                          <Link to={`/produit/${l.slug}`} className="mt-1 block font-display text-[15px] uppercase leading-[1.2] hover:underline sm:text-[16px]">{l.produit.nom}</Link>
                          <p className={`${detail} mt-1.5 flex flex-wrap items-center gap-1.5`}>Taille {l.taille}<span aria-hidden>·</span><PastilleCouleur nom={l.coloris} /><span aria-hidden>·</span>{formatDH(l.prixDH)} l'unité</p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap font-display text-[14px] tabular-nums sm:text-[18px]">{formatDH(l.totalDH)}</span>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
                        <Quantite petit valeur={l.quantite} onChange={n => changerQuantite(l.cle, n)} libelle={`Quantité de ${l.produit.nom}`} />
                        <button type="button" onClick={() => { const r = retirer(l.cle); if (r) notifier({ ton: 'info', message: 'Article retiré.', action: { libelle: 'Annuler', onClick: () => restaurer(r) } }) }}
                          className="font-mono text-[11px] uppercase tracking-[0.16em] text-gris underline underline-offset-4 transition-colors hover:text-danger">Retirer</button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {/* Récapitulatif C-29 (comme le checkout) */}
            <aside className="self-start rounded-3xl bg-encre p-8 text-fond lg:sticky lg:top-[100px]">
              <h2 className="mb-6 font-display text-[18px] uppercase leading-[1.5] tracking-[0.04em]">Récapitulatif</h2>
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex justify-between text-[13px] text-fond/60"><span>Sous-total · {nb} article{nb > 1 ? 's' : ''}</span><span className="tabular-nums">{formatDH(total)}</span></div>
                <div className="flex justify-between text-[13px] text-fond/60"><span>Livraison</span><span>{frais === null ? 'À confirmer' : frais === 0 ? 'Offerte' : formatDH(frais)}</span></div>
                <div className="mt-2 flex items-baseline justify-between border-t border-fond/10 pt-2">
                  <span className="font-display text-[15px] uppercase tracking-[0.08em]">Total</span>
                  <span className="font-display text-[26px] tabular-nums">{formatDH(total + (frais ?? 0))}</span>
                </div>
              </div>
              <div className="mb-6 rounded-[18px] bg-accent p-5 text-encre shadow-[0_8px_28px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-[14px] uppercase leading-[1.25] tracking-[0.04em]">À payer à la livraison</p>
                  <p className="whitespace-nowrap font-display text-[28px] leading-none tabular-nums">{formatDH(total + (frais ?? 0))}</p>
                </div>
                <p className="mt-3 text-[13px] leading-[1.5]">Rien à payer en ligne.</p>
                <p className="mt-1 text-[13px] font-semibold leading-[1.5]">{boutique.paiement}</p>
              </div>
              <Link to="/commande" className="flex w-full items-center justify-center gap-3 rounded-full bg-accent py-4 font-display text-[13px] uppercase tracking-[0.16em] text-encre transition-all hover:scale-[1.02] hover:bg-accent-doux">
                Commander<ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link to="/boutique" className="mt-3 block text-center font-mono text-[11px] uppercase tracking-[0.18em] text-fond/60 transition-colors hover:text-fond">Continuer mes achats</Link>
              <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-fond/40">Commande confirmée avec vous sur WhatsApp</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
