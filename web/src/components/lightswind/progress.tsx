/**
 * Adapté de Lightswind UI — « progress » (licence MIT, https://lightswind.com/components/progress).
 * Barre de progression accessible (role="progressbar") pour une part réelle : disponibilité, quota. Remplissage animé à
 * l'entrée (scaleX : transform seulement), ton choisi par l'écran (succès, alerte, danger, encre).
 */
import { motion } from 'framer-motion'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

const TONS = { succes: 'bg-succes', alerte: 'bg-alerte', danger: 'bg-danger', encre: 'bg-encre', accent: 'bg-admin-accent' } as const

export function Progress({ valeur, max = 100, ton = 'encre', libelle, className }: { valeur: number; max?: number; ton?: keyof typeof TONS; libelle: string; className?: string }) {
  const actives = useAnimationsActives()
  const part = Math.max(0, Math.min(100, (valeur / max) * 100))
  return (
    <div role="progressbar" aria-label={libelle} aria-valuemin={0} aria-valuemax={max} aria-valuenow={valeur}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-fond-3', className)}>
      <motion.div className={cn('h-full w-full origin-left rounded-full', TONS[ton])} initial={actives ? { scaleX: 0 } : false} animate={{ scaleX: part / 100 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  )
}
