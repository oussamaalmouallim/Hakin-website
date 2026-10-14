import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { BoutonFermer, BoutonLien, Cadre, EtatVide, ImageProduit, Prix, Quantite, Tiroir, useNotifier } from '@/design-system'
import { useInterface } from '@/state/interface'
import { lignesDetaillees, sousTotal, usePanier } from '@/state/panier'
import { categoriesActives, collections, estPackshot, produits } from '@/lib/catalogue'
import { rechercher } from '@/lib/recherche'
import { formatDH } from '@/lib/format'
import { EASE_MAISON } from '@/lib/animations'
import { boutique } from '@/lib/catalogue'
import { LIENS_PRINCIPAUX } from './EnTete'
import { LiensReseaux } from './Reseaux'

/** Ferme tout panneau ouvert quand l'adresse change. */
export function useFermerSurNavigation() {
  const { pathname, search } = useLocation()
  const fermer = useInterface(s => s.fermer)
  useEffect(() => { fermer() }, [pathname, search, fermer])
}

export function MiniPanier() {
  const ouvert = useInterface(s => s.panneau === 'panier')
  const fermer = useInterface(s => s.fermer)
  const { lignes, changerQuantite, retirer, restaurer } = usePanier()
  const notifier = useNotifier()
  const details = lignesDetaillees(lignes)
  const retirerAvecAnnulation = (cle: string) => {
    const l = retirer(cle)
    if (l) notifier({ ton: 'info', message: 'Article retiré du panier.', action: { libelle: 'Annuler', onClick: () => restaurer(l) } })
  }
  return (
    <Tiroir ouvert={ouvert} onFermer={fermer} label="Panier" titre={`Panier${details.length ? ` · ${details.length}` : ''}`}
      pied={details.length ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between"><span className="label">Sous-total</span><span className="text-[17px] tabular-nums">{formatDH(sousTotal(lignes))}</span></div>
          <p className="text-[13px] text-gris">{boutique.paiement}. Livraison calculée à la confirmation.</p>
          <BoutonLien to="/commande" plein_largeur>Commander</BoutonLien>
          <BoutonLien to="/panier" variante="contour" plein_largeur>Voir le panier</BoutonLien>
        </div>) : undefined}>
      {details.length === 0 ? (
        <EtatVide titre="Votre panier est vide" icone={<ShoppingBag className="h-7 w-7" strokeWidth={1} />}
          action={<BoutonLien to="/boutique" variante="contour">Découvrir la boutique</BoutonLien>} />
      ) : (
        <ul className="flex flex-col divide-y divide-ligne">
          <AnimatePresence initial={false}>
            {details.map(l => (
              <motion.li key={l.cle} layout exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.4, ease: EASE_MAISON }} className="flex gap-4 py-5 first:pt-0">
                <Link to={`/produit/${l.slug}`} className="w-20 shrink-0"><Cadre compact className="aspect-[4/5]"><ImageProduit src={l.produit.images[0].src} alt={l.produit.images[0].alt} packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="80px" /></Cadre></Link>
                <div className="flex flex-1 flex-col gap-1.5">
                  <p className="label text-gris">{l.produit.marque}</p>
                  <Link to={`/produit/${l.slug}`} className="font-display text-[17px] leading-tight hover:text-bronze">{l.produit.nom}</Link>
                  <p className="text-[13px] text-gris">{l.coloris} · Taille {l.taille}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <Quantite petit valeur={l.quantite} onChange={n => changerQuantite(l.cle, n)} />
                    <Prix prixDH={l.totalDH} />
                  </div>
                </div>
                <button type="button" onClick={() => retirerAvecAnnulation(l.cle)} aria-label={`Retirer ${l.produit.nom} du panier`} className="self-start p-1 text-gris hover:text-erreur">
                  <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Tiroir>
  )
}

export function MenuMobile() {
  const ouvert = useInterface(s => s.panneau === 'menu')
  const fermer = useInterface(s => s.fermer)
  const liens = [...LIENS_PRINCIPAUX, ...categoriesActives().map(c => ({ vers: `/boutique/${c.slug}`, libelle: c.nom })), { vers: '/compte', libelle: 'Mon compte' }]
  return (
    <Tiroir ouvert={ouvert} onFermer={fermer} cote="gauche" label="Menu" titre="Menu" pied={<LiensReseaux />}>
      <motion.ul className="flex flex-col" initial="cache" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}>
        {liens.map(l => (
          <motion.li key={l.vers} variants={{ cache: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_MAISON } } }}>
            <Link to={l.vers} className="flex items-center justify-between border-b border-ligne py-4 font-display text-[28px] leading-none">
              {l.libelle}<ArrowRight className="h-4 w-4 text-gris" strokeWidth={1.25} />
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </Tiroir>
  )
}

export function Recherche() {
  const ouvert = useInterface(s => s.panneau === 'recherche')
  const fermer = useInterface(s => s.fermer)
  const naviguer = useNavigate()
  const [q, setQ] = useState('')
  useEffect(() => { if (!ouvert) setQ('') }, [ouvert])
  const res = useMemo(() => rechercher(produits, q).slice(0, 6), [q])
  useEffect(() => {
    if (!ouvert) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && fermer()
    document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f)
  }, [ouvert, fermer])
  return (
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Recherche">
          <motion.div className="absolute inset-0 bg-encre/30" onClick={fermer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="relative bg-nacre shadow-flottant" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.7, ease: EASE_MAISON }}>
            <div className="conteneur py-6 sm:py-10">
              <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) naviguer(`/recherche?q=${encodeURIComponent(q.trim())}`) }}
                className="flex items-center gap-4 border-b border-encre pb-3">
                <Search className="h-5 w-5 shrink-0" strokeWidth={1.25} aria-hidden />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une pièce, une maison, un coloris…" aria-label="Rechercher"
                  className="w-full bg-transparent font-display text-[clamp(1.5rem,3vw,2.25rem)] outline-none placeholder:text-gris-clair" />
                <BoutonFermer onClick={fermer} />
              </form>
              <div className="mt-6 min-h-[2rem]">
                {q.trim() === '' ? (
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <span className="label text-gris">Suggestions</span>
                    {[...categoriesActives().map(c => ({ vers: `/boutique/${c.slug}`, l: c.nom })), ...collections.map(c => ({ vers: `/collections/${c.slug}`, l: c.nom }))].map(s => (
                      <Link key={s.vers} to={s.vers} className="lien-souligne text-[15px]">{s.l}</Link>
                    ))}
                  </div>
                ) : res.length === 0 ? (
                  <p className="text-gris">Aucun résultat pour « {q} ».</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {res.map(p => (
                      <li key={p.slug}>
                        <Link to={`/produit/${p.slug}`} className="group block">
                          <Cadre compact className="aspect-[4/5]"><ImageProduit src={p.images[0].src} alt={p.images[0].alt} packshot={estPackshot(p)} className="absolute inset-0" tailles="160px" zoomSurvol /></Cadre>
                          <p className="mt-2 font-display text-[16px] leading-tight">{p.nom}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
