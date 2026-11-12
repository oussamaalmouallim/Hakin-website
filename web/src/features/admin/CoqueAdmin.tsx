import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, Plus, Search, UserRound } from 'lucide-react'
import { Logotype } from '@/design-system'
import { Badge } from '@/components/lightswind/badge'
import { CommandDialog, type CommandItem } from '@/components/lightswind/command'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton, SidebarProvider, useSidebar } from '@/components/lightswind/sidebar'
import { Tooltip } from '@/components/lightswind/tooltip'
import { cn } from '@/lib/utils'
import { etatSupervision, listerCommandes, listerDemandes, type RoleAdmin, type StatutService } from './api'
import { groupesVisibles, pageCourante } from './navigation'
import { STATUTS, pireStatut } from './supervisionCommun'

/** Coque d'application de l'administration : barre latérale (Lightswind « sidebar »), barre du haut avec fil d'Ariane,
 *  recherche Ctrl+K (Lightswind « command »), état global de la supervision (rôle technique) et compte connecté.
 *  Les compteurs de la barre sont des nombres réels lus en base, relus au plus une fois par minute en naviguant. */

const RELECTURE_MS = 60_000

/** Vrai tant que la coque est montée (une lecture lancée puis « annulée » par le double montage du mode strict
 *  doit quand même écrire son résultat : la relecture suivante est retenue une minute). */
function useMonte() {
  const monte = useRef(true)
  useEffect(() => { monte.current = true; return () => { monte.current = false } }, [])
  return monte
}

function useCompteurs(chemin: string) {
  const [c, setC] = useState<{ commandes?: number; demandes?: number }>({})
  const dernier = useRef(0)
  const monte = useMonte()
  useEffect(() => {
    if (Date.now() - dernier.current < RELECTURE_MS) return
    dernier.current = Date.now()
    void Promise.allSettled([listerCommandes(), listerDemandes()]).then(([co, de]) => {
      if (!monte.current) return
      setC({
        commandes: co.status === 'fulfilled' ? co.value.filter(x => x.statut === 'nouvelle').length : undefined,
        demandes: de.status === 'fulfilled' ? de.value.filter(x => x.statut === 'a_traiter').length : undefined,
      })
    })
  }, [chemin, monte])
  return c
}

/** État global (le pire des services) pour la barre du haut ; rôle technique seulement, sinon aucun appel. */
function useEtatGlobal(role: RoleAdmin, chemin: string) {
  const [statut, setStatut] = useState<StatutService | null>(null)
  const dernier = useRef(0)
  const monte = useMonte()
  useEffect(() => {
    if (role !== 'technique' || Date.now() - dernier.current < RELECTURE_MS) return
    dernier.current = Date.now()
    etatSupervision().then(e => monte.current && setStatut(pireStatut(e.services))).catch(() => monte.current && setStatut(null))
  }, [role, chemin, monte])
  return statut
}

/** Logo de la barre : le monogramme seul quand elle est repliée (le nom reste lu par les lecteurs d'écran). */
function LogoBarre() {
  const { repliee } = useSidebar()
  return (
    <Link to="/admin" className={cn('flex min-w-0 items-center', repliee && 'lg:mx-auto')}>
      <Logotype clair sousTitre="Administration" className={cn(repliee && 'lg:[&>span:last-child]:sr-only')} /><span className="sr-only"> — tableau de bord</span>
    </Link>
  )
}

function BoutonReplier() {
  const { repliee, basculer } = useSidebar()
  const Icone = repliee ? ChevronsRight : ChevronsLeft
  return (
    <button type="button" onClick={basculer} aria-label={repliee ? 'Déployer le menu' : 'Replier le menu'} aria-expanded={!repliee}
      className="hidden h-8 w-8 shrink-0 place-items-center rounded-[8px] text-gris transition-colors hover:bg-fond-3 hover:text-encre lg:grid">
      <Icone className="h-4 w-4" aria-hidden />
    </button>
  )
}

function BoutonMenuMobile() {
  const { setMobileOuvert } = useSidebar()
  return (
    <button type="button" onClick={() => setMobileOuvert(true)} aria-label="Ouvrir le menu"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-ligne bg-fond-2 text-encre lg:hidden">
      <Menu className="h-4 w-4" aria-hidden />
    </button>
  )
}

function PiedBarre({ email, role, onQuitter }: { email: string; role: RoleAdmin; onQuitter: () => void }) {
  const { repliee } = useSidebar()
  return (
    <div className={cn('flex items-center gap-3', repliee && 'lg:flex-col')}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-admin-barre-2 text-[12px] font-semibold uppercase text-admin-accent" aria-hidden>{email.slice(0, 1)}</span>
      <div className={cn('min-w-0 flex-1', repliee && 'lg:sr-only')}>
        <p className="truncate text-[12.5px] font-medium text-fond-2" title={email}>{email}</p>
        <p className="text-[11.5px] text-admin-barre-texte">Rôle {role === 'technique' ? 'technique' : 'commerce'}</p>
      </div>
      <Tooltip texte="Se déconnecter" actif={repliee}>
        <button type="button" onClick={onQuitter} aria-label="Se déconnecter"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-admin-barre-texte transition-colors hover:bg-admin-barre-2 hover:text-fond-2">
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </Tooltip>
    </div>
  )
}

function MenuCompte({ email, onQuitter }: { email: string; onQuitter: () => void }) {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ouvert) return
    const clic = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOuvert(false) }
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false) }
    document.addEventListener('mousedown', clic); document.addEventListener('keydown', touche)
    return () => { document.removeEventListener('mousedown', clic); document.removeEventListener('keydown', touche) }
  }, [ouvert])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-haspopup="menu" aria-label="Compte"
        className="grid h-9 w-9 place-items-center rounded-[9px] border border-ligne bg-fond-2 text-encre transition-colors hover:bg-fond-3">
        <UserRound className="h-4 w-4" aria-hidden />
      </button>
      {ouvert && (
        <div role="menu" aria-label="Compte" className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-bloc border border-ligne bg-fond-2 p-1.5 shadow-flottant">
          <p className="truncate px-3 pb-2 pt-1.5 text-[12px] text-gris" title={email}>{email}</p>
          <Link role="menuitem" to="/" className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] hover:bg-fond-3"><ExternalLink className="h-4 w-4 text-gris" aria-hidden />Voir le site</Link>
          <button role="menuitem" type="button" onClick={onQuitter} className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] text-danger hover:bg-fond-3"><LogOut className="h-4 w-4" aria-hidden />Déconnexion</button>
        </div>
      )}
    </div>
  )
}

function BarreDuHaut({ role, email, onRecherche, onQuitter, statut }: { role: RoleAdmin; email: string; onRecherche: () => void; onQuitter: () => void; statut: StatutService | null }) {
  const { pathname } = useLocation()
  const ici = pageCourante(pathname, role)
  const fiche = /^\/admin\/produits\/.+/.test(pathname) ? (pathname.endsWith('/nouveau') ? 'Nouvelle pièce' : 'Fiche') : null
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ligne bg-fond-2/85 px-4 backdrop-blur-md md:px-6">
      <BoutonMenuMobile />
      <BoutonReplier />
      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {ici && <li className="hidden shrink-0 text-gris sm:block">{ici.groupe.titre}</li>}
          {ici && <li className="hidden shrink-0 text-gris-clair sm:block" aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>}
          {ici && (fiche
            ? <li className="min-w-0 truncate"><Link to={ici.page.vers} className="text-gris hover:text-encre">{ici.page.libelle}</Link></li>
            : <li className="min-w-0 truncate font-medium" aria-current="page">{ici.page.libelle}</li>)}
          {fiche && <><li className="shrink-0 text-gris-clair" aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li><li className="truncate font-medium" aria-current="page">{fiche}</li></>}
        </ol>
      </nav>
      <button type="button" onClick={onRecherche} aria-keyshortcuts="Control+K"
        className="flex h-9 items-center gap-2 rounded-[9px] border border-ligne bg-fond px-3 text-[13px] text-gris transition-colors hover:border-ligne-forte hover:text-encre md:w-60">
        <Search className="h-4 w-4 shrink-0" aria-hidden /><span className="sr-only flex-1 text-left md:not-sr-only">Rechercher…</span>
        <kbd className="hidden rounded-[5px] border border-ligne bg-fond-2 px-1.5 font-mono text-[10.5px] md:block">Ctrl K</kbd>
      </button>
      {role === 'technique' && statut && (
        <Link to="/admin/supervision/sante" className="hidden rounded-full sm:block" aria-label={`État du site : ${STATUTS[statut].libelle}`}>
          <Badge variant={STATUTS[statut].ton} point pulse={statut === 'operationnel'} size="md">{STATUTS[statut].libelle}</Badge>
        </Link>
      )}
      <MenuCompte email={email} onQuitter={onQuitter} />
    </header>
  )
}

export function CoqueAdmin({ email, role, onQuitter, children }: { email: string; role: RoleAdmin; onQuitter: () => void; children: ReactNode }) {
  const { pathname } = useLocation()
  const naviguer = useNavigate()
  const compteurs = useCompteurs(pathname)
  const statut = useEtatGlobal(role, pathname)
  const [recherche, setRecherche] = useState(false)
  const groupes = groupesVisibles(role)

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setRecherche(o => !o) } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  const commandes = useMemo<CommandItem[]>(() => [
    ...groupes.flatMap(g => g.pages.map(p => ({ id: p.vers, libelle: p.libelle, groupe: g.titre, motsCles: p.motsCles, icone: <p.Icone className="h-3.5 w-3.5" aria-hidden />, onSelect: () => naviguer(p.vers) }))),
    { id: 'nouvelle-piece', libelle: 'Nouvelle pièce', groupe: 'Actions', motsCles: 'ajouter produit créer', icone: <Plus className="h-3.5 w-3.5" aria-hidden />, onSelect: () => naviguer('/admin/produits/nouveau') },
    { id: 'site', libelle: 'Voir le site', groupe: 'Actions', motsCles: 'boutique public', icone: <ExternalLink className="h-3.5 w-3.5" aria-hidden />, onSelect: () => naviguer('/') },
    { id: 'quitter', libelle: 'Se déconnecter', groupe: 'Actions', motsCles: 'quitter déconnexion', icone: <LogOut className="h-3.5 w-3.5" aria-hidden />, onSelect: onQuitter },
  ], [groupes, naviguer, onQuitter])

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-fond text-encre lg:flex">
        <a href="#contenu-admin" className="sr-only z-[110] rounded-[8px] bg-encre px-4 py-3 text-[13px] text-fond-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
        <Sidebar label="Menu de l'administration">
          <SidebarHeader><LogoBarre /></SidebarHeader>
          <SidebarContent label="Administration">
            {groupes.map(g => (
              <SidebarGroup key={g.titre} titre={g.titre}>
                {g.pages.map(p => <SidebarMenuButton key={p.vers} vers={p.vers} libelle={p.libelle} Icone={p.Icone} fin={p.fin} compteur={p.compteur ? compteurs[p.compteur] : undefined} />)}
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter><PiedBarre email={email} role={role} onQuitter={onQuitter} /></SidebarFooter>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <BarreDuHaut role={role} email={email} statut={statut} onRecherche={() => setRecherche(true)} onQuitter={onQuitter} />
          <main id="contenu-admin" className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
      <CommandDialog ouvert={recherche} onFermer={() => setRecherche(false)} items={commandes} placeholder="Aller à une page, lancer une action…" />
    </SidebarProvider>
  )
}
