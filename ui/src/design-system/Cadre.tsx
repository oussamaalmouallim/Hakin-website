import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Support des images hors cartes produit (galerie, collections, vignettes) : même finition que la carte produit
 * (Lightswind seasonal-hover-cards) — coins finement arrondis, ombre douce, aucun filet ni cadre dans l'image.
 * Dimensionner par `className` (ex. `aspect-[4/5]`) ; l'image enfant est en `absolute inset-0`.
 */
export function Cadre({ children, className, compact }: { children: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-sable-50', compact ? 'rounded-[4px]' : 'rounded-[6px] shadow-carte', className)}>
      {children}
    </div>
  )
}
