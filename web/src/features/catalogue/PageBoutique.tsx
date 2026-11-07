import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { usePiegeFocus } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { produits, trouverCategorie } from '@/lib/catalogue'
import { appliquerFiltres, facettesCroisees, filtresDepuisURL, filtresVersURL, nbFiltresActifs, type Filtres, type Tri } from '@/lib/filtres'
import { cn } from '@/lib/utils'
import { Page404 } from '@/features/infos/Page404'
import { PanneauFiltres, PucesActives } from './Filtres'

/** 24 cartes par page (Mesuré : 24 `article` sur la page 1 de la référence). */
const PAR_PAGE = 24
const TRIS: { v: Tri; l: string; prix?: boolean }[] = [
  { v: 'pertinence', l: 'Mis en avant' }, { v: 'nouveautes', l: 'Nouveautés' },
  { v: 'prix-croissant', l: 'Prix : croissant', prix: true }, { v: 'prix-decroissant', l: 'Prix : décroissant', prix: true }, { v: 'nom', l: 'Nom : A → Z' }]

const pilule = 'rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em]'

/** cloneme: C-11 — tiroir de filtres mobile de la référence : voile encre 40 %, panneau gauche 300 px `p-8`,
 *  titre 18 px + croix, colonne de filtres, bouton « Appliquer les filtres » Archivo Black 13 px. Sans animation (Relevé). */
function TiroirFiltres({ ouvert, onFermer, children }: { ouvert: boolean; onFermer: () => void; children: React.ReactNode }) {
  const ref = usePiegeFocus(ouvert, onFermer)
  if (!ouvert) return null
  return createPortal(
    <div className="fixed inset-0 z-[500]">
      <div className="absolute inset-0 bg-encre/40" onClick={onFermer} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Filtres" className="absolute bottom-0 left-0 top-0 w-[300px] max-w-full overflow-y-auto overscroll-contain bg-fond p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-[18px] uppercase">Filtres</span>
          <button type="button" onClick={onFermer} aria-label="Fermer les filtres" className="text-encre"><X className="h-5 w-5" strokeWidth={1.75} /></button>
        </div>
        {children}
        <button type="button" onClick={onFermer} className="mt-6 w-full rounded-full bg-encre py-4 font-display text-[13px] uppercase tracking-[0.16em] text-fond">Appliquer les filtres</button>
      </div>
    </div>, document.body)
}

/** cloneme: P-02, C-12 — page boutique de la référence (`/shop`) : bandeau titre + compteur + tri, colonne de filtres 220 px,
 *  grille 2 / 3 colonnes écart 24 px, pagination « Préc. / 1 2 / Suiv. ».
 *  H MODE : `/boutique/:categorie` coche le type de vêtement ; tout changement de filtre repasse sur `/boutique?…`. */
export function PageBoutique() {
  const { categorie: slugCat } = useParams()
  const categorie = slugCat ? trouverCategorie(slugCat) : undefined
  const [sp, setSp] = useSearchParams()
  const naviguer = useNavigate()
  const filtres = useMemo(() => {
    const f = filtresDepuisURL(sp)
    return categorie && !f.categories.includes(categorie.slug) ? { ...f, categories: [categorie.slug, ...f.categories] } : f
  }, [sp, categorie])
  const [page, setPage] = useState(1)
  const [panneau, setPanneau] = useState(false)
  const haut = useRef<HTMLDivElement>(null)

  const resultats = useMemo(() => appliquerFiltres(produits, filtres), [filtres])
  const fac = useMemo(() => facettesCroisees(produits, filtres), [filtres])
  useEffect(() => setPage(1), [filtres])
  if (slugCat && !categorie) return <Page404 />

  const changer = (f: Filtres) => {
    const q = filtresVersURL(f)
    // Une seule catégorie et rien d'autre : l'adresse propre /boutique/<type>, sinon /boutique?…
    if (f.categories.length === 1 && [...q.keys()].every(k => k === 'categorie' || k === 'tri')) {
      q.delete('categorie')
      naviguer({ pathname: `/boutique/${f.categories[0]}`, search: q.toString() }, { replace: true })
    } else if (slugCat) naviguer({ pathname: '/boutique', search: q.toString() }, { replace: true })
    else setSp(q, { replace: true })
  }
  const allerPage = (n: number) => { setPage(n); haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const seule = filtres.categories.length === 1 ? trouverCategorie(filtres.categories[0]) : undefined
  const actifs = nbFiltresActifs(filtres)
  // Rayons du menu (référence : Hommes, Femmes, Soldes) : titre de la page et état vide dédié
  const rayon = filtres.solde ? 'Soldes' : filtres.genre === 'homme' ? 'Hommes' : filtres.genre === 'femme' ? 'Femmes' : null
  const rayonVide = rayon !== null && resultats.length === 0 && actifs === 0
  const nbPages = Math.max(1, Math.ceil(resultats.length / PAR_PAGE))
  const visibles = resultats.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)
  const tris = TRIS.filter(t => fac.prix || !t.prix)

  return (
    <div className="min-h-screen pt-20">
      <div ref={haut} className="flex scroll-mt-20 flex-wrap items-center justify-between gap-4 border-b border-ligne px-5 py-6 md:px-14">
        <div>
          <h1 data-ref="boutique-titre" className="font-display text-[28px] uppercase leading-[1.5] tracking-[0.02em]">{rayon ? (seule ? `${rayon} · ${seule.nom}` : rayon) : seule ? seule.nom : 'Toute la boutique'}</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-gris" aria-live="polite">{resultats.length} pièce{resultats.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPanneau(true)} className={cn(pilule, 'flex items-center gap-2 border-encre text-encre transition-colors hover:bg-encre hover:text-fond md:hidden')}>
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />Filtres{actifs ? ` (${actifs})` : ''}
          </button>
          <select aria-label="Trier" value={tris.some(t => t.v === filtres.tri) ? filtres.tri : 'pertinence'} onChange={e => changer({ ...filtres, tri: e.target.value as Tri })}
            className={cn(pilule, 'cursor-pointer border-ligne bg-transparent text-encre outline-none focus-visible:border-encre')}>
            {tris.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-10 px-5 py-8 md:px-14">
        <div className="hidden w-[220px] shrink-0 md:block">
          <PanneauFiltres filtres={filtres} onChange={changer} facettes={fac} />
        </div>
        <div className="min-w-0 flex-1">
          {actifs > 0 && <div className="mb-6 md:hidden"><PucesActives filtres={filtres} onChange={changer} /></div>}
          {rayonVide ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">{filtres.solde ? 'Aucune pièce en solde' : 'Aucune pièce pour le moment'}</h2>
              <p className="max-w-[300px] text-sm text-gris">{filtres.solde ? 'Les pièces en solde apparaîtront ici dès leur mise en ligne.' : `Les pièces ${filtres.genre === 'femme' ? 'femme' : 'homme'} apparaîtront ici dès leur mise en ligne.`}</p>
              <Link to="/boutique" className={cn(pilule, 'border-encre px-6 py-3 transition-colors hover:bg-encre hover:text-fond')}>Voir toute la boutique</Link>
            </div>
          ) : resultats.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Aucune pièce</h2>
              <p className="max-w-[280px] text-sm text-gris">Aucune pièce ne correspond à ces filtres. Retirez-en un pour élargir la recherche.</p>
              <button type="button" onClick={() => changer({ ...filtres, categories: [], marques: [], coloris: [], tailles: [], collections: [], etiquettes: [], disponibles: false, prixMax: null })}
                className={cn(pilule, 'border-encre px-6 py-3 transition-colors hover:bg-encre hover:text-fond')}>Tout effacer</button>
            </div>
          ) : (
            <>
              <ul data-ref="grille" className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {visibles.map((p, i) => <li key={p.slug}><CarteProduit produit={p} prioritaire={page === 1 && i < 3} /></li>)}
              </ul>
              {nbPages > 1 && (
                <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                  <button type="button" disabled={page === 1} onClick={() => allerPage(page - 1)}
                    className={cn(pilule, 'border-ligne text-encre transition-colors hover:border-encre disabled:cursor-not-allowed disabled:opacity-40')}>Préc.</button>
                  {Array.from({ length: nbPages }, (_, i) => i + 1).map(n => (
                    <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => allerPage(n)}
                      className={cn('h-10 w-10 rounded-full border font-mono text-[12px] transition-all', n === page ? 'border-encre bg-encre text-fond' : 'border-ligne text-encre hover:border-encre')}>{n}</button>
                  ))}
                  <button type="button" disabled={page === nbPages} onClick={() => allerPage(page + 1)}
                    className={cn(pilule, 'border-ligne text-encre transition-colors hover:border-encre disabled:cursor-not-allowed disabled:opacity-40')}>Suiv.</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <TiroirFiltres ouvert={panneau} onFermer={() => setPanneau(false)}>
        <PanneauFiltres filtres={filtres} onChange={changer} facettes={fac} />
      </TiroirFiltres>
    </div>
  )
}
