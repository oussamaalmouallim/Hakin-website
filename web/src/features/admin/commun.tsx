import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Bouton, Modale } from '@/design-system'
import { cn } from '@/lib/utils'

/** Briques communes des écrans d'administration, dans la charte du site (encre, fond crème, jaune, mono capitales). */

export function EnTeteAdmin({ surtitre, titre, texte, actions }: { surtitre?: string; titre: string; texte?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-ligne pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {surtitre && <p className="label mb-2 text-gris">{surtitre}</p>}
        <h1 className="font-display text-[clamp(28px,4vw,40px)] uppercase leading-[0.95] tracking-[-0.01em]">{titre}</h1>
        {texte && <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-gris">{texte}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

export function CarteAdmin({ titre, texte, children, className, actions }: { titre?: string; texte?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn('rounded-carte bg-fond-2 p-5 md:p-6', className)}>
      {(titre || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titre && <h2 className="font-display text-[16px] uppercase tracking-[0.02em]">{titre}</h2>}
            {texte && <p className="mt-1 text-[13px] text-gris">{texte}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/** Interrupteur accessible (role="switch") : visibilité d'une pièce, badges. */
export function Interrupteur({ actif, onChange, libelle, desactive }: { actif: boolean; onChange: (v: boolean) => void; libelle: string; desactive?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={actif} aria-label={libelle} disabled={desactive} onClick={() => onChange(!actif)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-40',
        actif ? 'border-encre bg-encre' : 'border-ligne-forte bg-blanc')}>
      <span className={cn('inline-block h-4 w-4 rounded-full transition-transform', actif ? 'translate-x-[22px] bg-accent' : 'translate-x-[3px] bg-gris')} />
    </button>
  )
}

export function Pastille({ children, ton = 'neutre' }: { children: ReactNode; ton?: 'neutre' | 'encre' | 'accent' | 'danger' | 'succes' | 'alerte' }) {
  const tons = {
    alerte: 'border border-alerte bg-alerte/10 text-bronze-fonce', // texte foncé : l'ocre seul n'atteint pas 4,5:1 sur les fonds clairs
    neutre: 'border border-ligne-forte text-gris',
    encre: 'bg-encre text-fond',
    accent: 'bg-accent text-encre',
    danger: 'border border-danger text-danger',
    succes: 'border border-succes text-succes',
  }
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]', tons[ton])}>{children}</span>
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return <p role="status" className="flex items-center gap-3 py-10 text-[14px] text-gris"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{texte}</p>
}

export function ErreurAdmin({ message, onReessayer }: { message: string; onReessayer?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-carte border border-danger bg-blanc p-5 text-[14px]">
      <p className="text-danger">{message}</p>
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
