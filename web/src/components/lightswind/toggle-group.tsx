/**
 * Adapté de Lightswind UI — « toggle-group » (licence MIT, https://lightswind.com/components/toggle-group).
 * Contrôle segmenté à choix unique (filtres) : groupe nommé, boutons à état pressé (aria-pressed), repère animé qui glisse
 * sous le choix actif (framer-motion, layoutId), sans animation quand elles sont coupées.
 */
import { useId } from 'react'
import { motion } from 'framer-motion'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export function ToggleGroup<T extends string>({ libelle, options, valeur, onChange, masquerLibelle, className }: {
  libelle: string; options: { v: T; l: string; n?: number }[]; valeur: T; onChange: (v: T) => void; masquerLibelle?: boolean; className?: string
}) {
  const id = useId()
  const actives = useAnimationsActives()
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={cn('text-[12px] font-medium text-gris', masquerLibelle && 'sr-only')} id={`${id}-l`}>{libelle}</span>
      <div role="group" aria-label={libelle} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-bloc border border-ligne bg-fond-3/60 p-0.5">
        {options.map(o => {
          const actif = valeur === o.v
          return (
            <button key={o.v} type="button" aria-pressed={actif} onClick={() => onChange(o.v)}
              className={cn('relative rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                actif ? 'text-encre' : 'text-gris hover:text-encre')}>
              {actif && (actives
                ? <motion.span layoutId={`${id}-repere`} className="absolute inset-0 rounded-[8px] bg-fond-2 shadow-carte ring-1 ring-ligne" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                : <span className="absolute inset-0 rounded-[8px] bg-fond-2 shadow-carte ring-1 ring-ligne" />)}
              <span className="relative">{o.l}{o.n !== undefined && <span className="ml-1.5 tabular-nums text-gris">{o.n}</span>}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
