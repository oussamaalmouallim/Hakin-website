/**
 * Adapté de Lightswind UI — « tooltip » (licence MIT, https://lightswind.com/components/tooltip).
 * Info-bulle au survol ET au focus clavier (barre latérale repliée, icônes seules). Le texte reste dans l'arbre
 * d'accessibilité par aria-describedby ; apparition en fondu court, sans animation quand elles sont coupées.
 */
import { cloneElement, useId, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export function Tooltip({ texte, children, cote = 'droite', actif = true }: { texte: string; children: ReactElement; cote?: 'droite' | 'haut' | 'bas'; actif?: boolean }) {
  const id = useId()
  const [ouvert, setOuvert] = useState(false)
  const actives = useAnimationsActives()
  if (!actif) return children
  const position = { droite: 'left-full top-1/2 ml-2 -translate-y-1/2', haut: 'bottom-full left-1/2 mb-2 -translate-x-1/2', bas: 'top-full left-1/2 mt-2 -translate-x-1/2' }[cote]
  return (
    <span className="relative flex" onMouseEnter={() => setOuvert(true)} onMouseLeave={() => setOuvert(false)} onFocus={() => setOuvert(true)} onBlur={() => setOuvert(false)}>
      {ouvert ? cloneElement(children, { 'aria-describedby': id } as Record<string, unknown>) : children}
      <AnimatePresence>
        {ouvert && (
          <motion.span id={id} role="tooltip" initial={actives ? { opacity: 0, scale: 0.96 } : false} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className={cn('pointer-events-none absolute z-50 whitespace-nowrap rounded-[8px] bg-encre px-2.5 py-1.5 text-[12px] font-medium text-fond-2 shadow-flottant', position)}>
            {texte}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
