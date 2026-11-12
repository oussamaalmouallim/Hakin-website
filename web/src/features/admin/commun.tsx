import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Loader2, type LucideIcon } from 'lucide-react'
import { Bouton, Modale } from '@/design-system'
import { Badge } from '@/components/lightswind/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/lightswind/card'
import { CountUp } from '@/components/lightswind/count-up'
import { Progress } from '@/components/lightswind/progress'
import { Skeleton } from '@/components/lightswind/skeleton'
import { cn } from '@/lib/utils'

/** Briques communes des écrans d'administration : une seule application, mêmes proportions partout.
 *  Thème d'application technique (classe theme-admin), composants Lightswind adaptés (components/lightswind/). */

export function EnTeteAdmin({ surtitre, titre, texte, actions }: { surtitre?: string; titre: string; texte?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {surtitre && <p className="mb-1.5 text-[12px] font-medium text-admin-accent-fonce">{surtitre}</p>}
        <h1 className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.15] tracking-[-0.02em]">{titre}</h1>
        {texte && <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.6] text-gris">{texte}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

/** Carte de contenu (Lightswind « card ») : titre, description, actions à droite, contenu. */
export function CarteAdmin({ titre, texte, children, className, actions, sansMarge }: { titre?: string; texte?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; sansMarge?: boolean }) {
  return (
    <Card className={className}>
      {(titre || actions) && (
        <CardHeader>
          <div className="min-w-0">
            {titre && <CardTitle>{titre}</CardTitle>}
            {texte && <CardDescription>{texte}</CardDescription>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(sansMarge && 'p-0 pt-4')}>{children}</CardContent>
    </Card>
  )
}

/** Interrupteur accessible (role="switch") : visibilité d'une pièce, badges. */
export function Interrupteur({ actif, onChange, libelle, desactive }: { actif: boolean; onChange: (v: boolean) => void; libelle: string; desactive?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={actif} aria-label={libelle} disabled={desactive} onClick={() => onChange(!actif)}
      className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40',
        actif ? 'bg-succes' : 'bg-gris-clair/70')}>
      <span className={cn('inline-block h-4 w-4 rounded-full bg-fond-2 shadow-carte transition-transform', actif ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
    </button>
  )
}

export type TonPastille = 'neutre' | 'encre' | 'accent' | 'danger' | 'succes' | 'alerte' | 'info'
/** Badge de statut (Lightswind « badge ») : `point` pour un état, sinon simple étiquette. */
export function Pastille({ children, ton = 'neutre', point }: { children: ReactNode; ton?: TonPastille; point?: boolean }) {
  return <Badge variant={ton} point={point}>{children}</Badge>
}

/** Indicateur clé : une valeur RÉELLE (jamais inventée ; absente = « — »), son libellé, une aide, et au choix une
 *  barre de part réelle ou un lien vers la liste. Nombre entier = compteur animé (Lightswind « count-up »). */
export function KpiCarte({ libelle, valeur, unite, aide, ton = 'normal', Icone, vers, part }: {
  libelle: string; valeur: number | string | null | undefined; unite?: string; aide?: ReactNode; ton?: 'normal' | 'succes' | 'alerte' | 'danger'
  Icone?: LucideIcon; vers?: string; part?: { valeur: number; max?: number; ton?: 'succes' | 'alerte' | 'danger' | 'encre' | 'accent' }
}) {
  const couleur = { normal: 'text-encre', succes: 'text-succes', alerte: 'text-bronze-fonce', danger: 'text-danger' }[ton]
  const corps = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-medium leading-snug text-gris">{libelle}</span>
        {Icone && <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-ligne bg-fond', ton !== 'normal' ? couleur : 'text-gris')}><Icone className="h-4 w-4" strokeWidth={1.75} aria-hidden /></span>}
      </div>
      <div className={cn('mt-3 flex items-baseline gap-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em]', couleur)}>
        {valeur === null || valeur === undefined ? <span className="text-gris-clair">—</span>
          : typeof valeur === 'number' && Number.isInteger(valeur) ? <CountUp value={valeur} duree={1.1} />
          : <span className="tabular-nums">{typeof valeur === 'number' ? String(valeur).replace('.', ',') : valeur}</span>}
        {unite && valeur !== null && valeur !== undefined && <span className="text-[13px] font-medium text-gris">{unite}</span>}
      </div>
      {part && <Progress className="mt-3" valeur={part.valeur} max={part.max} ton={part.ton} libelle={libelle} />}
      {aide && <p className="mt-2 text-[12px] leading-snug text-gris">{aide}</p>}
      {vers && <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-gris-clair transition-colors group-hover:text-encre" aria-hidden />}
    </>
  )
  return vers
    ? <Link to={vers} className="group relative block rounded-carte border border-ligne bg-fond-2 p-4 shadow-carte transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-ligne-forte">{corps}</Link>
    : <div className="relative rounded-carte border border-ligne bg-fond-2 p-4 shadow-carte">{corps}</div>
}

/** Grille d'indicateurs : 2 colonnes sur mobile, 4 sur grand écran (ou `colonnes`). */
export function GrilleKpi({ children, colonnes = 4 }: { children: ReactNode; colonnes?: 3 | 4 | 5 }) {
  return <div className={cn('grid grid-cols-2 gap-3', colonnes === 3 && 'lg:grid-cols-3', colonnes === 4 && 'lg:grid-cols-4', colonnes === 5 && 'md:grid-cols-3 xl:grid-cols-5')}>{children}</div>
}

/** État vide : ce qui manque, et quoi faire. Jamais une liste vide sans explication. */
export function EtatVide({ Icone, titre, texte, action }: { Icone?: LucideIcon; titre: string; texte?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-bloc border border-dashed border-ligne-forte bg-fond/60 px-6 py-10 text-center">
      {Icone && <span className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-fond-3 text-gris"><Icone className="h-5 w-5" strokeWidth={1.5} aria-hidden /></span>}
      <p className="text-[14px] font-medium">{titre}</p>
      {texte && <p className="max-w-md text-[13px] leading-[1.55] text-gris">{texte}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Squelette de page (Lightswind « skeleton ») pendant le premier chargement : indicateurs puis bloc. */
export function SqueletteAdmin({ kpi = 4, lignes = 5 }: { kpi?: number; lignes?: number }) {
  return (
    <div role="status" aria-label="Chargement…" className="flex flex-col gap-4">
      {kpi > 0 && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: kpi }, (_, i) => <Skeleton key={i} className="h-[108px] rounded-carte" />)}</div>}
      <div className="rounded-carte border border-ligne bg-fond-2 p-5">
        <Skeleton className="mb-5 h-4 w-48" />
        <div className="flex flex-col gap-3">{Array.from({ length: lignes }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
      </div>
    </div>
  )
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return <p role="status" className="flex items-center gap-3 py-10 text-[13.5px] text-gris"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{texte}</p>
}

export function ErreurAdmin({ message, onReessayer }: { message: string; onReessayer?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-bloc border border-danger/30 bg-danger/5 p-4 text-[13.5px]">
      <p className="flex items-start gap-2.5 text-danger"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{message}</p>
      {onReessayer && <Bouton variante="contour" taille="sm" onClick={onReessayer}>Réessayer</Bouton>}
    </div>
  )
}

/** Fenêtre de confirmation pour les actions qu'on ne peut pas annuler (suppression). */
export function Confirmation({ ouvert, titre, texte, libelle, onConfirmer, onFermer }: {
  ouvert: boolean; titre: string; texte: ReactNode; libelle: string; onConfirmer: () => Promise<void> | void; onFermer: () => void
}) {
  const [envoi, setEnvoi] = useState(false)
  return (
    <Modale ouvert={ouvert} onFermer={() => !envoi && onFermer()} titre={titre}>
      <div className="text-[14px] leading-[1.6] text-gris">{texte}</div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Bouton chargement={envoi} className="bg-danger hover:bg-danger/90" onClick={async () => { setEnvoi(true); try { await onConfirmer() } finally { setEnvoi(false) } }}>{libelle}</Bouton>
        <Bouton variante="contour" disabled={envoi} onClick={onFermer}>Annuler</Bouton>
      </div>
    </Modale>
  )
}

/** Charge une donnée de la base, avec état de chargement, erreur et rechargement. */
export function useChargement<T>(charger: () => Promise<T>) {
  const [etat, setEtat] = useState<{ donnees: T | null; erreur: string | null; enCours: boolean }>({ donnees: null, erreur: null, enCours: true })
  const ref = useRef(charger)
  ref.current = charger
  // Seule la réponse du dernier chargement compte : une réponse en retard n'écrase ni une plus récente ni une saisie.
  const jeton = useRef(0)
  const recharger = useCallback(async () => {
    const n = ++jeton.current
    setEtat(e => ({ ...e, enCours: true, erreur: null }))
    try { const d = await ref.current(); if (n === jeton.current) setEtat({ donnees: d, erreur: null, enCours: false }) }
    catch (e) { if (n === jeton.current) setEtat(s => ({ ...s, erreur: (e as Error).message, enCours: false })) }
  }, [])
  useEffect(() => { void recharger(); return () => { jeton.current++ } }, [recharger])
  return { ...etat, recharger, remplacer: (d: T) => setEtat(e => ({ ...e, donnees: d })) }
}

/** Prévient avant de quitter l'onglet avec des modifications non enregistrées. */
export function useAvertirSiModifie(modifie: boolean) {
  useEffect(() => {
    if (!modifie) return
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [modifie])
}

export const formatDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
