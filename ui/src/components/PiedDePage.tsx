import { Link } from 'react-router-dom'
import { Logotype, Signature } from '@/design-system'
import { boutique, categoriesActives } from '@/lib/catalogue'
import { useAnimations } from '@/state/animations'
import { LiensReseaux } from './Reseaux'

const COLONNES = [
  { titre: 'Boutique', liens: [{ vers: '/boutique', l: 'Toute la boutique' }, { vers: '/collections', l: 'Collections' }] },
  { titre: 'Aide', liens: [{ vers: '/contact', l: 'Contact' }, { vers: '/livraison-retours', l: 'Livraison & retours' }, { vers: '/guide-des-tailles', l: 'Guide des tailles' }, { vers: '/faq', l: 'Questions fréquentes' }] },
  { titre: 'La Maison', liens: [{ vers: '/maison', l: 'Notre histoire' }, { vers: '/compte', l: 'Mon compte' }, { vers: '/mentions-legales', l: 'Mentions légales' }, { vers: '/confidentialite', l: 'Confidentialité' }, { vers: '/cgv', l: 'Conditions de vente' }] },
]

export function PiedDePage() {
  const { animations, basculer } = useAnimations()
  const colonnes = [{ ...COLONNES[0], liens: [...COLONNES[0].liens, ...categoriesActives().map(c => ({ vers: `/boutique/${c.slug}`, l: c.nom }))] }, ...COLONNES.slice(1)]
  return (
    <footer className="mt-32 bg-encre text-nacre">
      <div className="conteneur py-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-6">
            <Logotype clair />
            <p className="max-w-xs text-[15px] text-nacre/65">Boutique de vêtements premium homme · {boutique.ville}. Commande sur WhatsApp, {boutique.paiement.toLowerCase()}.</p>
            <LiensReseaux clair />
          </div>
          {colonnes.map(c => (
            <div key={c.titre}>
              <p className="label mb-6 text-or">{c.titre}</p>
              <ul className="flex flex-col gap-3">
                {c.liens.map(l => <li key={l.vers}><Link to={l.vers} className="text-[15px] text-nacre/75 transition-colors hover:text-nacre">{l.l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <Signature className="mt-20 [&_p]:text-nacre/50" />
      </div>
      <div className="border-t border-nacre/10">
        <div className="conteneur flex flex-col items-center justify-between gap-3 py-6 text-[12px] text-nacre/50 sm:flex-row">
          <span>© {new Date().getFullYear()} H MODE — {boutique.ville}</span>
          <button type="button" onClick={basculer} className="label hover:text-nacre" aria-pressed={!animations}>
            Animations : {animations ? 'activées' : 'désactivées'}
          </button>
        </div>
      </div>
    </footer>
  )
}
