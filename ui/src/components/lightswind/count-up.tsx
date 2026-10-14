/**
 * Adapté de Lightswind UI — « count-up » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : compte jusqu'à une valeur RÉELLE (issue des données) quand le nombre entre à l'écran.
 * Animations coupées : valeur finale affichée directement.
 */
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export function CountUp({ value, duree = 1.8, className }: { value: number; duree?: number; className?: string }) {
  const actives = useAnimationsActives()
  const ref = useRef<HTMLSpanElement>(null)
  const vu = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [affiche, setAffiche] = useState(actives ? 0 : value)
  useEffect(() => {
    if (!actives) { setAffiche(value); return }
    if (!vu) return
    const c = animate(0, value, { duration: duree, ease: [0.16, 1, 0.3, 1], onUpdate: v => setAffiche(Math.round(v)) })
    return () => c.stop()
  }, [actives, vu, value, duree])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <span aria-hidden>{affiche}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
