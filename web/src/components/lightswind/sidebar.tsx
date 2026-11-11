/**
 * Adapté de Lightswind UI — « sidebar » (licence MIT, https://lightswind.com/components/sidebar).
 * Repris : fournisseur d'état (déployée / repliée), groupes et libellés, repère de l'élément actif qui glisse d'un lien à
 * l'autre (framer-motion, layoutId, ressort 400 / 35), pied collé en bas.
 * Adapté : liens = NavLink de react-router (l'actif vient de l'adresse, pas d'un état local), choix « repliée » gardé par
 * le navigateur, tiroir sur mobile (fond assombri, Échap, fermé à chaque navigation), info-bulle sur les icônes quand la
 * barre est repliée, aucune animation quand elles sont coupées, couleurs de l'admin (tokens --admin-barre*).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'
import { Tooltip } from './tooltip'

const CLE_REPLIEE = 'hmode-admin-barre-repliee'
const lire = () => { try { return localStorage.getItem(CLE_REPLIEE) === '1' } catch { return false } }

interface Etat { repliee: boolean; basculer: () => void; mobileOuvert: boolean; setMobileOuvert: (v: boolean) => void }
const Ctx = createContext<Etat | null>(null)

export function useSidebar() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSidebar : à utiliser dans <SidebarProvider>')
  return c
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [repliee, setRepliee] = useState(lire)
  const [mobileOuvert, setMobileOuvert] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMobileOuvert(false), [pathname])
  useEffect(() => {
    if (!mobileOuvert) return
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOuvert(false) }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [mobileOuvert])
  const basculer = useCallback(() => setRepliee(r => {
    try { localStorage.setItem(CLE_REPLIEE, r ? '0' : '1') } catch { /* stockage indisponible : choix gardé le temps de la page */ }
    return !r
  }), [])
  const valeur = useMemo(() => ({ repliee, basculer, mobileOuvert, setMobileOuvert }), [repliee, basculer, mobileOuvert])
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

/** La barre : colonne collée à gauche sur grand écran (284 px, 76 px repliée), tiroir sur mobile. */
export function Sidebar({ children, label }: { children: ReactNode; label: string }) {
  const { repliee, mobileOuvert, setMobileOuvert } = useSidebar()
  const ref = useRef<HTMLElement>(null)
  // Tiroir ouvert au clavier : le focus va au premier lien du menu.
  useEffect(() => { if (mobileOuvert) ref.current?.querySelector<HTMLElement>('nav a')?.focus() }, [mobileOuvert])
  return (
    <>
      {mobileOuvert && <div className="fixed inset-0 z-40 bg-encre/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOuvert(false)} aria-hidden />}
      <aside ref={ref} aria-label={label} data-repliee={repliee || undefined}
        className={cn('group/barre fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-admin-barre text-fond-2 transition-transform duration-300 ease-maison',
          'lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0',
          mobileOuvert ? 'translate-x-0 shadow-flottant' : 'max-lg:invisible -translate-x-full',
          repliee ? 'lg:w-[76px]' : 'lg:w-[284px]')}>
        {children}
      </aside>
    </>
  )
}

export function SidebarHeader({ children }: { children: ReactNode }) {
  return <div className="flex h-16 shrink-0 items-center gap-2 border-b border-admin-barre-ligne px-4">{children}</div>
}

export function SidebarContent({ children, label }: { children: ReactNode; label: string }) {
  return (
    <nav aria-label={label} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </nav>
  )
}

export function SidebarGroup({ titre, children }: { titre: string; children: ReactNode }) {
  const { repliee } = useSidebar()
  return (
    <div className="mb-5 last:mb-0">
      <p className={cn('mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-admin-barre-texte/80', repliee && 'lg:sr-only')}>{titre}</p>
      {repliee && <div className="mx-3 mb-2 hidden h-px bg-admin-barre-ligne lg:block" aria-hidden />}
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  )
}

/** Un lien de la barre. `compteur` : nombre réel à traiter (masqué à 0) ; `fin` : actif seulement sur l'adresse exacte. */
export function SidebarMenuButton({ vers, libelle, Icone, fin, compteur }: { vers: string; libelle: string; Icone: LucideIcon; fin?: boolean; compteur?: number }) {
  const { repliee } = useSidebar()
  const actives = useAnimationsActives()
  return (
    <li>
      <Tooltip texte={libelle} actif={repliee}>
        <NavLink to={vers} end={fin}
          className={({ isActive }) => cn('relative flex h-9 w-full items-center gap-3 rounded-[9px] px-3 text-[13.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-admin-accent',
            isActive ? 'font-medium text-fond-2' : 'text-admin-barre-texte hover:bg-admin-barre-2/70 hover:text-fond-2',
            repliee && 'lg:justify-center lg:px-0')}>
          {({ isActive }) => (
            <>
              {isActive && (actives
                ? <motion.span layoutId="barre-admin-actif" className="absolute inset-0 rounded-[9px] bg-admin-barre-2 ring-1 ring-admin-barre-ligne" transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                : <span className="absolute inset-0 rounded-[9px] bg-admin-barre-2 ring-1 ring-admin-barre-ligne" />)}
              {isActive && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-admin-accent" aria-hidden />}
              <Icone className={cn('relative h-[17px] w-[17px] shrink-0', isActive && 'text-admin-accent')} strokeWidth={1.75} aria-hidden />
              <span className={cn('relative min-w-0 flex-1 truncate', repliee && 'lg:sr-only')}>{libelle}</span>
              {!!compteur && (
                <span aria-hidden className={cn('relative rounded-full bg-admin-accent px-1.5 py-px text-[11px] font-semibold tabular-nums text-admin-barre',
                  repliee && 'lg:absolute lg:right-1 lg:top-0.5 lg:px-1 lg:text-[9.5px]')}>{compteur > 99 ? '99+' : compteur}</span>
              )}
            </>
          )}
        </NavLink>
      </Tooltip>
    </li>
  )
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return <div className="shrink-0 border-t border-admin-barre-ligne p-3">{children}</div>
}
