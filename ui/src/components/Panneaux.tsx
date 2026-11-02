import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { BoutonLien, Cadre, ImageProduit, PastilleCouleur, Prix, Quantite, Tiroir, useNotifier, usePiegeFocus } from '@/design-system'
import { useInterface } from '@/state/interface'
import { useSession } from '@/state/session'
import { lignesDetaillees, sousTotal, usePanier } from '@/state/panier'
import { boutique, categoriesActives, estPackshot, produits } from '@/lib/catalogue'
import { rechercher, suggestions } from '@/lib/recherche'
import { formatDH } from '@/lib/format'
import { DUREE_MENU, DUREE_PANNEAU, EASE_MAISON, EASE_PANNEAU } from '@/lib/animations'
import { LiensReseaux } from './Reseaux'
import { LIENS_PRINCIPAUX } from './EnTete'

/** Ferme tout panneau ouvert quand l'adresse change. */
export function useFermerSurNavigation() {
  const { pathname, search } = useLocation()
  const fermer = useInterface(s => s.fermer)
  useEffect(() => { fermer() }, [pathname, search, fermer])
}

/** cloneme: C-06 — panier latéral de la référence (titre « Votre panier », état vide centré, bouton pilule). */
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
    <Tiroir ouvert={ouvert} onFermer={fermer} label="Panier" titre={<>Votre panier{details.length > 0 && <span className="font-mono text-[11px] tracking-[0.18em] text-gris">({details.length})</span>}</>}
      pied={details.length ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between"><span className="label text-gris">Sous-total</span><span className="font-display text-[18px] tabular-nums">{formatDH(sousTotal(lignes))}</span></div>
          <p className="text-[13px] text-gris">{boutique.paiement}. Livraison calculée à la confirmation.</p>
          <BoutonLien to="/commande" plein_largeur taille="lg">Commander</BoutonLien>
          <BoutonLien to="/panier" variante="contour" plein_largeur>Voir le panier</BoutonLien>
        </div>) : undefined}>
      {details.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-encre/5"><ShoppingBag className="h-6 w-6" strokeWidth={1.5} /></div>
          <h4 className="font-display text-[18px] uppercase tracking-[0.04em]">Panier vide</h4>
          <p className="max-w-[280px] text-sm leading-relaxed text-gris">Votre panier est vide. Ajoutez des pièces pour commencer.</p>
          <BoutonLien to="/boutique" variante="contour" className="mt-2">Continuer les achats</BoutonLien>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-ligne">
          <AnimatePresence initial={false}>
            {details.map(l => (
              <motion.li key={l.cle} layout exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.4, ease: EASE_MAISON }} className="flex gap-4 py-5 first:pt-0">
                <Link to={`/produit/${l.slug}`} className="w-20 shrink-0"><Cadre compact className="aspect-square"><ImageProduit src={l.produit.images[0].src} alt={l.produit.images[0].alt} packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="80px" /></Cadre></Link>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gris">{l.produit.marque}</p>
                  <Link to={`/produit/${l.slug}`} className="font-display text-[15px] leading-tight hover:underline">{l.produit.nom}</Link>
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gris"><PastilleCouleur nom={l.coloris} className="[&>span:first-child]:h-3 [&>span:first-child]:w-3" /><span aria-hidden>·</span>Taille {l.taille}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <Quantite petit valeur={l.quantite} onChange={n => changerQuantite(l.cle, n)} />
                    <Prix prixDH={l.totalDH} />
                  </div>
                </div>
                <button type="button" onClick={() => retirerAvecAnnulation(l.cle)} aria-label={`Retirer ${l.produit.nom} du panier`} className="self-start p-1 text-gris hover:text-danger">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Tiroir>
  )
}

/** cloneme: C-04, A-09 — menu mobile plein écran de la référence (.mobile-panel) : glisse de la droite en .4s,
 *  grands liens Archivo Black 36 px, liens secondaires en mono en bas. */
export function MenuMobile() {
  const ouvert = useInterface(s => s.panneau === 'menu')
  const fermer = useInterface(s => s.fermer)
  const ref = usePiegeFocus(ouvert, fermer)
  const { pathname, search } = useLocation()
  const connecte = useSession(s => Boolean(s.utilisateur) || !s.pret)
  // Référence : Boutique · Hommes · Femmes · Soldes (rouge) en Archivo Black 36 px ; H MODE ajoute Accueil en tête
  const liens = LIENS_PRINCIPAUX
  const secondaires = [
    { vers: '/collections', libelle: 'Collections' }, { vers: '/maison', libelle: 'La Maison' }, { vers: '/contact', libelle: 'Contact' },
    { vers: '/compte/favoris', libelle: 'Favoris' }, connecte ? { vers: '/compte', libelle: 'Compte' } : { vers: '/connexion', libelle: 'Connexion' },
  ]
  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Menu"
          className="fixed inset-0 z-[200] flex flex-col gap-8 overflow-y-auto overscroll-contain bg-fond px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-24"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: DUREE_MENU, ease: EASE_PANNEAU }}>
          <button type="button" onClick={fermer} aria-label="Fermer le menu" className="absolute right-5 top-5 grid h-10 w-10 place-items-center text-encre">
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <nav aria-label="Menu mobile" className="flex flex-col gap-5">
            {liens.map(l => (
              <Link key={l.vers} to={l.vers} aria-current={pathname + search === l.vers ? 'page' : undefined}
                className={`font-display text-[clamp(28px,9vw,36px)] leading-none tracking-[-0.01em] ${l.solde ? 'text-danger' : 'text-encre'} aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-4`}>{l.libelle}</Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {secondaires.map(l => <Link key={l.vers} to={l.vers} className="font-mono text-[11px] uppercase tracking-[0.18em] text-gris hover:text-encre">{l.libelle}</Link>)}
            </div>
            <LiensReseaux />
          </div>
        </motion.div>
      )}
    </AnimatePresence>, document.body)
}

/** cloneme: C-05, A-10 — recherche de la référence (.search-overlay) : volet qui descend du haut en .42s,
 *  champ Archivo Black souligné, « Recherches populaires » à gauche, « Pièces » à droite. */
export function Recherche() {
  const ouvert = useInterface(s => s.panneau === 'recherche')
  const fermer = useInterface(s => s.fermer)
  const ref = usePiegeFocus(ouvert, fermer)
  const naviguer = useNavigate()
  const [q, setQ] = useState('')
  useEffect(() => { if (!ouvert) setQ('') }, [ouvert])
  const vedettes = useMemo(() => produits.filter(p => p.misEnAvant).slice(0, 3), [])
  const tous = useMemo(() => (q.trim() ? rechercher(produits, q) : []), [q])
  const res = q.trim() ? tous.slice(0, 6) : vedettes
  const sugg = useMemo(() => suggestions(produits, q), [q])
  const populaires = categoriesActives().map(c => ({ vers: `/boutique/${c.slug}`, l: c.nom }))
  // Colonne gauche : marques et types correspondant à la saisie, sinon les recherches populaires (référence)
  const raccourcis = q.trim() && (sugg.marques.length || sugg.categories.length)
    ? [...sugg.marques.map(s => ({ vers: s.vers, l: s.libelle, n: s.n })), ...sugg.categories.map(s => ({ vers: s.vers, l: s.libelle, n: s.n }))].slice(0, 6)
    : populaires.map(s => ({ ...s, n: undefined as number | undefined }))
  const lienTout = `/recherche?q=${encodeURIComponent(q.trim())}`
  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[400]">
          <motion.div className="absolute inset-0 bg-encre/20" onClick={fermer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUREE_PANNEAU }} />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Recherche"
            className="relative border-b border-[var(--ligne-entete)] bg-fond px-5 pb-8 pt-6 md:px-14 md:pb-9 md:pt-[30px]"
            initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: DUREE_PANNEAU, ease: EASE_PANNEAU }}>
            <div className="mb-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-gris">
              <span>Recherche</span>
              <button type="button" onClick={fermer} className="rounded-full px-3 py-1.5 tracking-[0.18em] transition-colors hover:bg-encre/[0.06] hover:text-encre">Échap pour fermer</button>
            </div>
            <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) naviguer(`/recherche?q=${encodeURIComponent(q.trim())}`) }}
              className="flex items-center gap-[18px] border-b-[1.5px] border-encre pb-3.5">
              <Search className="h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden />
              <input data-autofocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher une pièce, une marque, un coloris"
                className="min-w-0 flex-1 bg-transparent py-1.5 font-display text-[clamp(28px,4vw,42px)] uppercase tracking-[-0.01em] text-encre outline-none placeholder:text-gris-clair" />
            </form>
            <div className="mt-[30px] grid max-h-[60vh] grid-cols-1 gap-6 overflow-y-auto md:max-h-[48vh] md:grid-cols-[1fr_1.4fr] md:gap-12">
              <div>
                <h5 className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-gris">{raccourcis[0]?.n !== undefined ? 'Marques et types' : 'Recherches populaires'}</h5>
                <ul className="flex flex-col gap-2.5">
                  {raccourcis.map(s => (
                    <li key={s.vers}>
                      <Link to={s.vers} className="group flex items-center gap-3.5 py-1.5 font-display text-[20px] uppercase tracking-[-0.005em] text-encre transition-transform duration-200 hover:translate-x-1.5">
                        {s.l}{s.n !== undefined && <span className="font-mono text-[11px] text-gris">{s.n}</span>}<span className="font-sans text-base text-gris">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h5 aria-live="polite" className="font-mono text-[11px] uppercase tracking-[0.22em] text-gris">{q.trim() ? `Résultats · ${tous.length}` : 'Pièces à la une'}</h5>
                  {tous.length > res.length && <Link to={lienTout} className="font-mono text-[11px] uppercase tracking-[0.2em] text-encre underline underline-offset-4">Voir les {tous.length} résultats →</Link>}
                </div>
                {res.length === 0 ? (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-gris">Aucune pièce ne correspond à « {q.trim()} ». Essayez une marque (« Nike »), un type (« t-shirt ») ou une couleur (« noir »).</p>
                    <Link to="/boutique" className="font-mono text-[11px] uppercase tracking-[0.2em] text-encre underline underline-offset-4">Voir toute la boutique →</Link>
                  </div>
                ) : (
                  <ul className="grid grid-cols-3 gap-4">
                    {res.map(p => (
                      <li key={p.slug}>
                        <Link to={`/produit/${p.slug}`} className="group block">
                          <Cadre compact className="aspect-square"><ImageProduit src={p.images[0].src} alt={p.images[0].alt} packshot={estPackshot(p)} className="absolute inset-0" tailles="160px" zoomSurvol /></Cadre>
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gris">{p.marque}</p>
                          <p className="font-display text-[13px] leading-tight">{p.nom}</p>
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
    </AnimatePresence>, document.body)
}
