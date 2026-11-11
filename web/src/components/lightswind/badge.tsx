/**
 * Adapté de Lightswind UI — « badge » (licence MIT, https://lightswind.com/components/badge).
 * Variantes par rôle (succès, alerte, danger, info, neutre, encre, accent) sur les tokens de l'admin ; `point` ajoute la
 * pastille de couleur, `pulse` la fait respirer (état en direct, coupé avec les animations).
 */
import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva('inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border font-medium leading-none', {
  variants: {
    variant: {
      neutre: 'border-ligne-forte bg-fond-2 text-gris',
      encre: 'border-encre bg-encre text-fond-2',
      succes: 'border-succes/25 bg-succes/10 text-succes',
      alerte: 'border-alerte/30 bg-alerte/10 text-bronze-fonce',
      danger: 'border-danger/25 bg-danger/10 text-danger',
      info: 'border-admin-info/25 bg-admin-info/10 text-admin-info',
      accent: 'border-admin-accent/50 bg-admin-accent/15 text-admin-accent-fonce',
    },
    size: { sm: 'px-2 py-[3px] text-[11px]', md: 'px-2.5 py-1 text-[12px]' },
  },
  defaultVariants: { variant: 'neutre', size: 'sm' },
})

const POINT: Record<string, string> = {
  neutre: 'bg-gris-clair', encre: 'bg-fond-2', succes: 'bg-succes', alerte: 'bg-alerte', danger: 'bg-danger', info: 'bg-admin-info', accent: 'bg-admin-accent',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { point?: boolean; pulse?: boolean }

export function Badge({ className, variant, size, point, pulse, children, ...props }: BadgeProps) {
  const couleur = POINT[variant ?? 'neutre']
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {point && (
        <span className="relative inline-flex h-1.5 w-1.5" aria-hidden>
          {pulse && <span className={cn('absolute inset-0 animate-lueur rounded-full', couleur)} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', couleur)} />
        </span>
      )}
      {children}
    </span>
  )
}
