import { Fragment, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, LayoutGrid, Rows2, SlidersHorizontal } from 'lucide-react'
import { Bouton, EtatVide, Monogramme, Revelation, Tiroir } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { EnTetePage } from '@/components/EnTetePage'
import { produits, trouverCategorie, collections } from '@/lib/catalogue'
import { appliquerFiltres, facettesCroisees, filtresDepuisURL, filtresVersURL, nbFiltresActifs, type Filtres, type Tri } from '@/lib/filtres'
import { cn } from '@/lib/utils'
import { Page404 } from '@/features/infos/Page404'
import { PanneauFiltres, PucesActives } from './Filtres'

const PAR_PAGE = 12
const TRIS: { v: Tri; l: string }[] = [
  { v: 'pertinence', l: 'Sélection' }, { v: 'prix-croissant', l: 'Prix croissant' }, { v: 'prix-decroissant', l: 'Prix décroissant' }, { v: 'nom', l: 'Nom A → Z' }]

/** Encart éditorial inséré dans la grille pour casser l'effet catalogue (texte seul : aucune photo ne montre la collection portée). */
function Encart({ index }: { index: number }) {
  const c = collections[index % collections.length]
  return (
    <Revelation className="h-full">
      <Link to={`/collections/${c.slug}`} className="group relative flex h-full min-h-[320px] flex-col items-center justify-center gap-5 overflow-hidden bg-sable-50 px-10 text-center">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-6 opacity-[0.07]"><Monogramme className="h-72" /></span>
        <span className="label text-bronze">Collection</span>
        <span className="titre-1 equilibre">{c.nom}</span>
        <span className="max-w-sm text-gris">{c.accroche}</span>
        <span className="lien-souligne label mt-4">Découvrir la collection <ArrowRight className="h-3.5 w-3.5" /></span>
      </Link>
    </Revelation>
  )
}

export function PageBoutique() {
  const { categorie: slugCat } = useParams()
  const categorie = slugCat ? trouverCategorie(slugCat) : undefined
  const [sp, setSp] = useSearchParams()
  const filtres = useMemo(() => filtresDepuisURL(sp), [sp])
  const [nb, setNb] = useState(PAR_PAGE)
  const [panneau, setPanneau] = useState(false)
  const [dense, setDense] = useState(false)

  const base = useMemo(() => (categorie ? produits.filter(p => p.categorie === categorie.slug) : produits), [categorie])
  const resultats = useMemo(() => appliquerFiltres(base, filtres), [base, filtres])
  const fac = useMemo(() => facettesCroisees(base, filtres), [base, filtres])
  if (slugCat && !categorie) return <Page404 />

  const changer = (f: Filtres) => { setSp(filtresVersURL(f), { replace: true }); setNb(PAR_PAGE) }
  const visibles = resultats.slice(0, nb)
  const actifs = nbFiltresActifs(filtres)

  return (
    <>
      <EnTetePage surtitre={categorie ? 'Catégorie' : 'Boutique'} titre={categorie ? categorie.nom : 'Toute la boutique'}
        texte={categorie ? categorie.accroche : 'Les pièces des grandes maisons, sélectionnées à Casablanca.'}
        ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Boutique', vers: '/boutique' }, ...(categorie ? [{ libelle: categorie.nom }] : [])]} />

      <div className="conteneur">
        <div className="sticky top-16 z-30 -mx-4 flex items-center justify-between gap-4 border-y border-ligne bg-nacre/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <Bouton variante="texte" onClick={() => setPanneau(true)} className="lg:hidden" icone={<SlidersHorizontal className="h-4 w-4" strokeWidth={1.25} />}>
            Filtres{actifs ? ` (${actifs})` : ''}
          </Bouton>
          <p className="label hidden text-gris lg:block" aria-live="polite">{resultats.length} pièce{resultats.length > 1 ? 's' : ''}</p>
          <div className="flex items-center gap-4">
            <label className="label flex items-center gap-2 text-gris">Trier
              <select value={!fac.avecPrix && filtres.tri.startsWith('prix') ? 'pertinence' : filtres.tri} onChange={e => changer({ ...filtres, tri: e.target.value as Tri })} className="cursor-pointer bg-transparent text-encre outline-none">
                {TRIS.filter(t => fac.avecPrix || !t.v.startsWith('prix')).map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>
            <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Densité d'affichage">
              <button type="button" aria-pressed={!dense} onClick={() => setDense(false)} className={cn('p-1.5', !dense ? 'text-encre' : 'text-gris-clair')} aria-label="Grandes vignettes"><Rows2 className="h-4 w-4" strokeWidth={1.25} /></button>
              <button type="button" aria-pressed={dense} onClick={() => setDense(true)} className={cn('p-1.5', dense ? 'text-encre' : 'text-gris-clair')} aria-label="Petites vignettes"><LayoutGrid className="h-4 w-4" strokeWidth={1.25} /></button>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block" aria-label="Filtres">
            <div className="sticky top-36"><PanneauFiltres filtres={filtres} onChange={changer} facettes={fac} /></div>
          </aside>
          <div>
            {actifs > 0 && <div className="mb-8"><PucesActives filtres={filtres} onChange={changer} /></div>}
            {resultats.length === 0 ? (
              <EtatVide titre="Aucune pièce ne correspond" texte="Essayez de retirer un filtre ou explorez toute la boutique."
                action={<Bouton variante="contour" onClick={() => changer({ ...filtres, marques: [], coloris: [], tailles: [], collections: [], disponibles: false })}>Réinitialiser les filtres</Bouton>} />
            ) : (
              <>
                <ul className={cn('grid gap-x-4 gap-y-12 sm:gap-x-6', dense ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-3')}>
                  {visibles.map((p, i) => (
                    <Fragment key={p.slug}>
                      {i === 6 && actifs === 0 && <li className="col-span-2 hidden md:block"><Encart index={0} /></li>}
                      <li><Revelation delai={(i % 3) * 0.08}><CarteProduit produit={p} prioritaire={i < 2} /></Revelation></li>
                    </Fragment>
                  ))}
                </ul>
                <div className="mt-16 flex flex-col items-center gap-5">
                  <p className="label text-gris">{visibles.length} sur {resultats.length}</p>
                  <div className="h-px w-48 bg-ligne"><div className="h-px bg-encre transition-[width] duration-700 ease-maison" style={{ width: `${(visibles.length / resultats.length) * 100}%` }} /></div>
                  {visibles.length < resultats.length && <Bouton variante="contour" onClick={() => setNb(n => n + PAR_PAGE)}>Voir plus</Bouton>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Tiroir ouvert={panneau} onFermer={() => setPanneau(false)} cote="gauche" label="Filtres" titre={`Filtres${actifs ? ` · ${actifs}` : ''}`}
        pied={<Bouton plein_largeur onClick={() => setPanneau(false)}>Voir {resultats.length} pièce{resultats.length > 1 ? 's' : ''}</Bouton>}>
        <PanneauFiltres filtres={filtres} onChange={changer} facettes={fac} />
      </Tiroir>
    </>
  )
}
