import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Coloris, TailleStock } from '@/lib/types'
import { QTE_MAX, QTE_MIN } from '@/state/panier'

export function SelecteurTaille({ tailles, valeur, onChange, erreur }: {
  tailles: TailleStock[]; valeur: string | null; onChange: (t: string) => void; erreur?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Taille" className="flex flex-wrap gap-2">
      {tailles.map(t => {
        const actif = valeur === t.taille
        return (
          <button key={t.taille} type="button" role="radio" aria-checked={actif} disabled={!t.disponible}
            aria-label={t.disponible ? `Taille ${t.taille}` : `Taille ${t.taille}, indisponible`}
            onClick={() => onChange(t.taille)}
            className={cn('relative h-11 min-w-[3.25rem] rounded-fin border px-3 font-sans text-[13px] tracking-wide transition-all duration-300 ease-maison',
              actif ? 'border-encre bg-encre text-nacre' : 'border-ligne bg-neige text-encre hover:border-encre/60',
              erreur && !actif && 'border-erreur/60',
              !t.disponible && 'cursor-not-allowed text-gris-clair line-through decoration-gris-clair')}>
            {t.taille}
          </button>
        )
      })}
    </div>
  )
}

export function SelecteurColoris({ coloris, valeur, onChange }: { coloris: Coloris[]; valeur: string | null; onChange: (c: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Coloris" className="flex flex-wrap gap-3">
      {coloris.map(c => {
        const actif = valeur === c.nom
        return (
          <button key={c.nom} type="button" role="radio" aria-checked={actif} aria-label={c.nom} title={c.nom}
            onClick={() => onChange(c.nom)}
            className={cn('grid h-9 w-9 place-items-center rounded-full border transition-all duration-300 ease-maison',
              actif ? 'border-encre' : 'border-transparent hover:border-encre/30')}>
            <span className="h-6 w-6 rounded-full ring-1 ring-inset ring-encre/10" style={{ backgroundColor: c.hex }} />
          </button>
        )
      })}
    </div>
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
  const h = petit ? 'h-9' : 'h-11'
  return (
    <div className={cn('inline-flex items-center border border-ligne bg-neige', h)} role="group" aria-label={libelle}>
      <button type="button" className={cn('grid w-9 place-items-center text-gris hover:text-encre disabled:opacity-30', h)}
        onClick={() => onChange(valeur - 1)} disabled={valeur <= QTE_MIN} aria-label="Diminuer la quantité"><Minus className="h-3.5 w-3.5" /></button>
      <span className="min-w-[2rem] text-center font-sans text-[14px] tabular-nums" aria-live="polite">{valeur}</span>
      <button type="button" className={cn('grid w-9 place-items-center text-gris hover:text-encre disabled:opacity-30', h)}
        onClick={() => onChange(valeur + 1)} disabled={valeur >= QTE_MAX} aria-label="Augmenter la quantité"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  )
}
