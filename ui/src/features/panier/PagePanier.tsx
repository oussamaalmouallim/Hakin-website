import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { BoutonLien, Cadre, EtatVide, ImageProduit, Prix, Quantite, useNotifier } from '@/design-system'
import { estPackshot } from '@/lib/catalogue'
import { EnTetePage } from '@/components/EnTetePage'
import { lignesDetaillees, nbArticles, sousTotal, usePanier } from '@/state/panier'
import { EASE_MAISON } from '@/lib/animations'
import { Recapitulatif } from './Recapitulatif'

export function PagePanier() {
  const { lignes, changerQuantite, retirer, restaurer } = usePanier()
  const notifier = useNotifier()
  const details = lignesDetaillees(lignes)
  const ariane = [{ libelle: 'Accueil', vers: '/' }, { libelle: 'Panier' }]
  if (!details.length) {
    return (
      <>
        <EnTetePage titre="Votre panier" ariane={ariane} />
        <EtatVide titre="Votre panier est vide" texte="Les pièces que vous ajouterez apparaîtront ici." icone={<ShoppingBag className="h-8 w-8" strokeWidth={1} />}
          action={<BoutonLien to="/boutique">Découvrir la boutique</BoutonLien>} />
      </>
    )
  }
  return (
    <>
      <EnTetePage titre="Votre panier" ariane={ariane} />
      <div className="conteneur grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-20">
        <ul className="border-t border-ligne">
          <AnimatePresence initial={false}>
            {details.map(l => (
              <motion.li key={l.cle} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: EASE_MAISON }} className="overflow-hidden border-b border-ligne">
                <div className="grid grid-cols-[96px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr_auto] sm:gap-8">
                  <Link to={`/produit/${l.slug}`}><Cadre compact className="aspect-[4/5]"><ImageProduit src={l.produit.images[0].src} alt={l.produit.images[0].alt} packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="120px" /></Cadre></Link>
                  <div className="flex flex-col gap-1.5">
                    <p className="label text-gris">{l.produit.marque}</p>
                    <Link to={`/produit/${l.slug}`} className="font-display text-[21px] leading-tight hover:text-bronze">{l.produit.nom}</Link>
                    <p className="text-[14px] capitalize text-gris">{l.coloris} · Taille {l.taille}</p>
                    <p className="text-[14px] text-gris">Prix unitaire : <Prix prixDH={l.prixDH} /></p>
                    <div className="mt-auto flex items-center gap-4 pt-3 sm:gap-6">
                      <Quantite petit valeur={l.quantite} onChange={n => changerQuantite(l.cle, n)} libelle={`Quantité de ${l.produit.nom}`} />
                      <button type="button" onClick={() => { const r = retirer(l.cle); if (r) notifier({ ton: 'info', message: 'Article retiré.', action: { libelle: 'Annuler', onClick: () => restaurer(r) } }) }}
                        className="label inline-flex items-center gap-1.5 text-gris hover:text-erreur"><X className="h-3.5 w-3.5" />Retirer</button>
                      <Prix prixDH={l.totalDH} className="ml-auto text-[16px] sm:hidden" />
                    </div>
                  </div>
                  <div className="hidden text-right sm:block"><Prix prixDH={l.totalDH} className="text-[16px]" /></div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Recapitulatif sousTotalDH={sousTotal(lignes)} nbArticles={nbArticles(lignes)}>
            <BoutonLien to="/commande" plein_largeur>Passer commande</BoutonLien>
            <BoutonLien to="/boutique" variante="texte" className="self-center">Continuer mes achats</BoutonLien>
          </Recapitulatif>
        </aside>
      </div>
    </>
  )
}
