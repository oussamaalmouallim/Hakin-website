import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EASE_MAISON } from '@/lib/animations'
import { useAnimationsActives } from '@/state/animations'

/** Apparition douce au défilement (une seule fois). Animations off : contenu visible d'emblée, sans attendre l'observateur. */
export function Revelation({ children, delai = 0, className, y = 28 }: { children: ReactNode; delai?: number; className?: string; y?: number }) {
  const actives = useAnimationsActives()
  return (
    <motion.div className={className} initial={actives ? { opacity: 0, y } : false} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 1, ease: EASE_MAISON, delay: delai }}>
      {children}
    </motion.div>
  )
}

/** Image dévoilée par un masque qui se retire. */
export function DevoilementImage({ children, className }: { children: ReactNode; className?: string }) {
  const actives = useAnimationsActives()
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {children}
      {actives && <motion.div aria-hidden className="absolute inset-0 origin-top bg-sable-100" initial={{ scaleY: 1 }} whileInView={{ scaleY: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 1.2, ease: EASE_MAISON }} />}
    </div>
  )
}
