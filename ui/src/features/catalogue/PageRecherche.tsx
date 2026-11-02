import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { BoutonLien, EtatVide, Revelation } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { EnTetePage } from '@/components/EnTetePage'
import { produits } from '@/lib/catalogue'
import { rechercher, suggestions } from '@/lib/recherche'

export function PageRecherche() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const [saisie, setSaisie] = useState(q)
  const res = useMemo(() => rechercher(produits, q), [q])
  const sugg = useMemo(() => suggestions(produits, q), [q])
  const raccourcis = [...sugg.marques, ...sugg.categories]
  // L'adresse change depuis le volet de recherche : le champ suit. La saisie met à jour les résultats en direct.
  useEffect(() => setSaisie(s => (s.trim() === q ? s : q)), [q])
  const changer = (v: string) => { setSaisie(v); setSp(v.trim() ? { q: v.trim() } : {}, { replace: true }) }
  return (
    <>
      <EnTetePage surtitre="Recherche" titre={q ? <>« {q} »</> : 'Rechercher'} texte={q ? `${res.length} résultat${res.length > 1 ? 's' : ''}` : undefined}
        ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Recherche' }]} />
      <div className="conteneur">
        <form role="search" onSubmit={e => { e.preventDefault(); changer(saisie) }} className="mb-14 flex max-w-xl items-center gap-3 border-b border-encre pb-2">
          <Search className="h-4 w-4" strokeWidth={1.25} aria-hidden />
          <input type="search" autoFocus={!q} value={saisie} onChange={e => changer(e.target.value)} aria-label="Rechercher" placeholder="Une pièce, une maison, un coloris…" className="w-full bg-transparent py-2 text-[17px] outline-none placeholder:text-gris-clair" />
        </form>
        {raccourcis.length > 0 && (
          <nav aria-label="Marques et types correspondants" className="-mt-6 mb-12 flex flex-wrap gap-2">
            {raccourcis.map(r => (
              <Link key={r.vers} to={r.vers} className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-encre transition-colors hover:bg-encre hover:text-fond">
                {r.libelle}<span className="text-gris">{r.n}</span>
              </Link>
            ))}
          </nav>
        )}
        {q && res.length === 0 ? (
          <EtatVide titre="Aucun résultat" texte="Vérifiez l'orthographe ou essayez un terme plus général (ex. « Dior », « noir », « t-shirt »)."
            action={<BoutonLien to="/boutique" variante="contour">Voir toute la boutique</BoutonLien>} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {res.map((p, i) => <li key={p.slug}><Revelation delai={(i % 4) * 0.06}><CarteProduit produit={p} /></Revelation></li>)}
          </ul>
        )}
      </div>
    </>
  )
}
