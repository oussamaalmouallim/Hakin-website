import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Heart, Search, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Logotype } from '@/design-system'
import { useInterface } from '@/state/interface'
import { nbArticles, usePanier } from '@/state/panier'
import { useFavoris } from '@/state/favoris'
import { useSession } from '@/state/session'
import { trouverCategorie } from '@/lib/catalogue'
import { SEUIL_ENTETE } from '@/lib/animations'
import { cn } from '@/lib/utils'

/** Menu principal : l'accueil, la boutique puis les types de vêtements les plus fournis (à la place de Hommes / Femmes / Soldes de la référence). */
export const LIENS_PRINCIPAUX = [
  { vers: '/', libelle: 'Accueil' },
  { vers: '/boutique', libelle: 'Boutique' },
  ...['t-shirts', 'sweats', 'sneakers'].flatMap(slug => {
    const c = trouverCategorie(slug)
    return c ? [{ vers: `/boutique/${c.slug}`, libelle: c.nom.split(' ')[0], large: true }] : []
  }),
]

/** Bouton rond 38 px de la référence (survol : fond encre 6 %). */
function BoutonRond({ label, onClick, vers, children, compteur, className }: { label: string; onClick?: () => void; vers?: string; children: ReactNode; compteur?: number; className?: string }) {
  const cls = cn('relative grid h-[38px] w-[38px] place-items-center rounded-full text-encre transition-colors duration-150 hover:bg-encre/[0.06]', className)
  const badge = compteur ? (
    <motion.span key={compteur} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 font-mono text-[10px] text-encre">{compteur}</motion.span>
  ) : null
  const lbl = compteur ? `${label} (${compteur})` : label
  return vers
    ? <Link to={vers} aria-label={lbl} className={cls}>{children}{badge}</Link>
    : <button type="button" aria-label={lbl} onClick={onClick} className={cls}>{children}{badge}</button>
}

/** cloneme: C-01, A-07, A-11 — en-tête fixe de la référence : logo · liens soulignés au survol · actions.
 *  Transparent en haut de page ; au-delà de 50 px : voile flouté, filet bas, padding réduit à 14 px. */
export function EnTete() {
  const ouvrir = useInterface(s => s.ouvrir)
  const menuOuvert = useInterface(s => s.panneau === 'menu')
  const fermer = useInterface(s => s.fermer)
  const nb = usePanier(s => nbArticles(s.lignes))
  const nbFav = useFavoris(s => s.slugs.length)
  const connecte = useSession(s => Boolean(s.utilisateur))
  const sessionPrete = useSession(s => s.pret)
  const [defile, setDefile] = useState(false)
  useEffect(() => {
    const f = () => setDefile(window.scrollY > SEUIL_ENTETE)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const icone = 'h-[18px] w-[18px]'
  return (
    <header data-ref="entete" className={cn('fixed inset-x-0 top-0 z-[100] flex items-center justify-between border-b px-5 py-4 transition-all duration-300 md:px-14 md:py-[22px]',
      defile ? 'border-[var(--ligne-entete)] bg-[var(--voile-entete)] !py-3.5 backdrop-blur-[18px] backdrop-saturate-[1.4]' : 'border-transparent')}>
      <Link to="/" aria-label="H MODE — accueil" className="flex shrink-0 items-center gap-2.5"><Logotype /></Link>
      <nav aria-label="Navigation principale" className="hidden md:block">
        {/* Écart 42 px (Mesuré) ; 24 px entre 768 et 1024 px car nos libellés français sont plus longs (Approximé).
            Sous 1280 px, seuls Accueil et Boutique tiennent : les types restent dans les filtres de la boutique. */}
        <ul className="flex gap-6 whitespace-nowrap lg:gap-[42px]">
          {LIENS_PRINCIPAUX.map(l => (
            <li key={l.vers} className={'large' in l ? 'hidden xl:block' : undefined}>
              <NavLink to={l.vers} end className={({ isActive }) => cn('lien-nav text-[14px] font-medium uppercase tracking-[0.16em] text-encre', isActive && 'actif')}>{l.libelle}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-1.5 md:gap-[22px]">
        <BoutonRond label="Rechercher" onClick={() => ouvrir('recherche')}><Search className={icone} strokeWidth={1.75} /></BoutonRond>
        <BoutonRond label="Favoris" vers="/compte/favoris" compteur={nbFav} className="hidden md:grid"><Heart className={icone} strokeWidth={1.75} /></BoutonRond>
        <BoutonRond label="Panier" onClick={() => ouvrir('panier')} compteur={nb} className="anim-secousse"><ShoppingBag className={icone} strokeWidth={1.75} /></BoutonRond>
        {/* Référence : pilule « Connexion » ; « Compte » une fois connecté */}
        <Link to={connecte || !sessionPrete ? '/compte' : '/connexion'} className="hidden items-center gap-2 rounded-full border border-ligne-forte px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-encre transition-colors hover:bg-encre hover:text-fond md:flex">{connecte || !sessionPrete ? 'Compte' : 'Connexion'}</Link>
        {/* cloneme: A-08 — burger : les trois traits deviennent une croix */}
        <button type="button" aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOuvert} onClick={() => (menuOuvert ? fermer() : ouvrir('menu'))}
          className="relative z-[210] flex h-[38px] w-[38px] flex-col items-center justify-center gap-1.5 md:hidden">
          <span className={cn('block h-[1.8px] w-[22px] origin-center bg-encre transition-all duration-[250ms]', menuOuvert && 'translate-y-[7.8px] rotate-45')} />
          <span className={cn('block h-[1.8px] w-[22px] bg-encre transition-all duration-[250ms]', menuOuvert && 'opacity-0')} />
          <span className={cn('block h-[1.8px] w-[22px] origin-center bg-encre transition-all duration-[250ms]', menuOuvert && '-translate-y-[7.8px] -rotate-45')} />
        </button>
      </div>
    </header>
  )
}
