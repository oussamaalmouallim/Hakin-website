/**
 * Adapté de Lightswind UI — « skeleton » (licence MIT, https://lightswind.com/components/skeleton).
 * Bloc de chargement avec reflet qui passe (coupé avec les animations : bloc fixe).
 */
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cn('animate-miroiter rounded-[8px] bg-[linear-gradient(90deg,var(--fond-3)_25%,var(--fond)_50%,var(--fond-3)_75%)] bg-[length:200%_100%]', className)} {...props} />
  )
}
