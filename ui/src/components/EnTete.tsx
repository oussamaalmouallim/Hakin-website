import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { Logotype, Monogramme } from '@/design-system'
import { useInterface } from '@/state/interface'
import { nbArticles, usePanier } from '@/state/panier'
import { useFavoris } from '@/state/favoris'
import { cn } from '@/lib/utils'

export const LIENS_PRINCIPAUX = [
  { vers: '/boutique', libelle: 'Boutique' },
  { vers: '/collections', libelle: 'Collections' },
  { vers: '/maison', libelle: 'La Maison' },
  { vers: '/contact', libelle: 'Contact' },
]

function BoutonIcone({ label, onClick, vers, children, compteur }: { label: string; onClick?: () => void; vers?: string; children: ReactNode; compteur?: number }) {
  const cls = 'relative grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 hover:bg-encre/5'
  const badge = compteur ? (
    <motion.span key={compteur} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-bronze px-1 font-sans text-[10px] text-nacre">{compteur}</motion.span>
  ) : null
  const lbl = compteur ? `${label} (${compteur})` : label
  return vers
    ? <Link to={vers} aria-label={lbl} className={cls}>{children}{badge}</Link>
    : <button type="button" aria-label={lbl} onClick={onClick} className={cls}>{children}{badge}</button>
}

/** En-tête : transparent sur le héros de l'accueil, nacré et compact au défilement. */
export function EnTete() {
  const { pathname } = useLocation()
  const ouvrir = useInterface(s => s.ouvrir)
  const nb = usePanier(s => nbArticles(s.lignes))
  const nbFav = useFavoris(s => s.slugs.length)
  const [defile, setDefile] = useState(false)
  useEffect(() => {
    const f = () => setDefile(window.scrollY > 40)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const transparent = pathname === '/' && !defile
  const icone = 'h-[19px] w-[19px]'
  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,height] duration-700 ease-maison',
      transparent ? 'bg-transparent' : 'bg-nacre/90 shadow-fin backdrop-blur-md')}>
      <div className={cn('conteneur grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-700 ease-maison', defile ? 'h-16' : 'h-[var(--nav-h)] lg:h-20')}>
        <nav aria-label="Navigation principale" className="flex items-center">
          <button type="button" className="-ml-2 grid h-10 w-10 place-items-center lg:hidden" aria-label="Ouvrir le menu" onClick={() => ouvrir('menu')}>
            <Menu className={icone} strokeWidth={1.25} />
          </button>
          <ul className="hidden items-center gap-9 lg:flex">
            {LIENS_PRINCIPAUX.map(l => (
              <li key={l.vers}>
                <NavLink to={l.vers} className={({ isActive }) => cn('label relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-500 after:ease-maison',
                  isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100')}>{l.libelle}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Link to="/" aria-label="H MODE — accueil"
          className={cn('justify-self-center transition-opacity duration-700 ease-maison', transparent && 'opacity-0 focus-visible:opacity-100')}>
          <Logotype className="hidden sm:inline-flex" />
          <Monogramme className="h-9 sm:hidden" />
        </Link>
        <div className="-mr-2 flex items-center justify-end gap-0.5">
          <BoutonIcone label="Rechercher" onClick={() => ouvrir('recherche')}><Search className={icone} strokeWidth={1.25} /></BoutonIcone>
          <span className="hidden sm:contents">
            <BoutonIcone label="Mon compte" vers="/compte"><User className={icone} strokeWidth={1.25} /></BoutonIcone>
            <BoutonIcone label="Favoris" vers="/compte/favoris" compteur={nbFav}><Heart className={icone} strokeWidth={1.25} /></BoutonIcone>
          </span>
          <BoutonIcone label="Panier" onClick={() => ouvrir('panier')} compteur={nb}><ShoppingBag className={icone} strokeWidth={1.25} /></BoutonIcone>
        </div>
      </div>
    </header>
  )
}
