/**
 * Adapté de Lightswind UI — « scroll-reveal » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : typo Cormorant, tokens de la charte, une seule apparition (once),
 * pas de rotation, flou léger, texte accessible en un seul bloc pour les lecteurs d'écran.
 */
import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAnimationsActives } from '@/state/animations'

export interface ScrollRevealProps {
  children: string
  className?: string
  /** Délai entre deux mots (s) */
  decalage?: number
  /** Part de l'élément visible avant de déclencher (0–1) */
  seuil?: number
  as?: 'p' | 'h2' | 'blockquote'
}

export function ScrollReveal({ children, className, decalage = 0.035, seuil = 0.4, as = 'p' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const actives = useAnimationsActives()
  const visible = useInView(ref, { amount: seuil, once: true }) || !actives
  const mots = useMemo(() => children.split(/(\s+)/).filter(Boolean), [children])
  const Balise = motion[as]
  return (
    <div ref={ref}>
      <Balise aria-label={children} className={cn('font-display', className)} initial={actives ? 'cache' : false} animate={visible ? 'visible' : 'cache'}
        variants={{ visible: { transition: { staggerChildren: decalage, delayChildren: 0.1 } } }}>
        {mots.map((m, i) => /^\s+$/.test(m) ? <span key={i} aria-hidden> </span> : (
          <motion.span key={i} aria-hidden className="inline-block"
            variants={{ cache: { opacity: 0.12, filter: 'blur(3px)', y: 14 }, visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } } }}>
            {m}
          </motion.span>
        ))}
      </Balise>
    </div>
  )
}

export default ScrollReveal
