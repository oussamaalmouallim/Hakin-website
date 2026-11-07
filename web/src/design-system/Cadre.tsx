import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Support des images hors cartes produit (panier, recherche, vignettes) : zone image de la référence —
 * fond `--fond-2`, rayon 20 px (12 px en `compact`, vignettes `rounded-xl`), sans ombre.
 * Dimensionner par `className` (ex. `aspect-square`) ; l'image enfant est en `absolute inset-0`.
 */
export function Cadre({ children, className, compact }: { children: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-fond-2', compact ? 'rounded-xl' : 'rounded-carte', className)}>
      {children}
    </div>
  )
}
