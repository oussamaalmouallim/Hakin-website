import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Coloris, TailleStock } from '@/lib/types'
import { QTE_MAX, QTE_MIN } from '@/state/panier'
import { HEX_COLORIS } from '@/lib/catalogue'

export function SelecteurTaille({ tailles, valeur, onChange, erreur }: {
  tailles: TailleStock[]; valeur: string | null; onChange: (t: string) => void; erreur?: boolean
}) {
  return (
    // cloneme: C-19 — tailles de la référence : grille 4 / 6 colonnes, pastilles rayon 10 px, mono 12 px, `py-2.5`, active pleine encre.
    <div role="radiogroup" aria-label="Taille" className="grid grid-cols-4 gap-2 md:grid-cols-6">
      {tailles.map(t => {
        const actif = valeur === t.taille
        return (
          <button key={t.taille} type="button" role="radio" aria-checked={actif} disabled={!t.disponible}
            aria-label={t.disponible ? `Taille ${t.taille}` : `Taille ${t.taille}, indisponible`}
            onClick={() => onChange(t.taille)}
            className={cn('relative overflow-hidden rounded-[10px] border py-2.5 font-mono text-[12px] tracking-widest transition-all',
              actif ? 'border-encre bg-encre text-fond' : 'border-ligne-forte bg-transparent text-encre hover:border-encre',
              erreur && !actif && 'border-danger/60',
              !t.disponible && 'cursor-not-allowed border-ligne opacity-40 line-through')}>
            {t.taille}
          </button>
        )
      })}
    </div>
  )
}

export function SelecteurColoris({ coloris, valeur, onChange }: { coloris: Coloris[]; valeur: string | null; onChange: (c: string) => void }) {
  return (
    // cloneme: C-19 — coloris : vignettes carrées de la référence (64 px chez elle, photos par coloris) ; H MODE n'a pas de photo par coloris → carré 48 px teinté.
    <div role="radiogroup" aria-label="Coloris" className="flex flex-wrap gap-3">
      {coloris.map(c => {
        const actif = valeur === c.nom
        return (
          <button key={c.nom} type="button" role="radio" aria-checked={actif} aria-label={c.nom} title={c.nom}
            onClick={() => onChange(c.nom)}
            className={cn('grid h-12 w-12 place-items-center overflow-hidden rounded-sm border bg-fond-2 p-1 transition-all',
              actif ? 'border-encre' : 'border-blanc/50 hover:border-gris')}>
            <span className="h-full w-full rounded-[2px] ring-1 ring-inset ring-encre/10" style={{ backgroundColor: c.hex }} />
          </button>
        )
      })}
    </div>
  )
}

/** Une couleur affichée en pastille : le nom reste dans l'info-bulle et pour les lecteurs d'écran.
 *  Sans teinte connue, on écrit le nom (jamais une pastille vide). */
export function PastilleCouleur({ nom, hex, className }: { nom: string; hex?: string; className?: string }) {
  const teinte = hex ?? HEX_COLORIS[nom]
  if (!teinte) return <span className={cn('capitalize', className)}>{nom}</span>
  return (
    <span title={nom} className={cn('inline-flex items-center align-middle', className)}>
      <span aria-hidden className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-encre/20" style={{ backgroundColor: teinte }} />
      <span className="sr-only">{nom}</span>
    </span>
  )
}

export function PastillesColoris({ coloris, max = 4 }: { coloris: Coloris[]; max?: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Coloris : ${coloris.map(c => c.nom).join(', ')}`}>
      {coloris.slice(0, max).map(c => <span key={c.nom} className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-encre/15" style={{ backgroundColor: c.hex }} />)}
      {coloris.length > max && <span className="text-[11px] text-gris">+{coloris.length - max}</span>}
    </div>
  )
}

export function Quantite({ valeur, onChange, petit, libelle = 'Quantité' }: { valeur: number; onChange: (n: number) => void; petit?: boolean; libelle?: string }) {
  // cloneme: C-19 — quantité de la référence : pilule bordée, boutons ronds 36 px, chiffre mono 13 px.
  const b = petit ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <div className="inline-flex items-center rounded-full border border-ligne-forte p-1" role="group" aria-label={libelle}>
      <button type="button" className={cn('grid place-items-center rounded-full text-encre transition-colors hover:bg-encre/[0.06] disabled:opacity-30', b)}
        onClick={() => onChange(valeur - 1)} disabled={valeur <= QTE_MIN} aria-label="Diminuer la quantité"><Minus className="h-3.5 w-3.5" /></button>
      <span className="min-w-8 text-center font-mono text-[13px] tabular-nums" aria-live="polite">{valeur}</span>
      <button type="button" className={cn('grid place-items-center rounded-full text-encre transition-colors hover:bg-encre/[0.06] disabled:opacity-30', b)}
        onClick={() => onChange(valeur + 1)} disabled={valeur >= QTE_MAX} aria-label="Augmenter la quantité"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  )
}
