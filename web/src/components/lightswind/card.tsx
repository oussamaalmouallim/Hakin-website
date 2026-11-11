/**
 * Adapté de Lightswind UI — « card » (licence MIT, https://lightswind.com/components/card).
 * Ré-habillé pour l'administration H MODE : surface blanche, bordure fine, rayon 14 px, ombre douce ; pas de flou ni de
 * couleur en dur (tokens de tokens.css, classe theme-admin). `survol` : carte cliquable qui se soulève légèrement.
 */
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { survol?: boolean }>(function Card({ className, survol, ...props }, ref) {
  return (
    <div ref={ref} className={cn('min-w-0 rounded-carte border border-ligne bg-fond-2 text-encre shadow-carte',
      survol && 'transition-[transform,box-shadow,border-color] duration-200 ease-standard hover:-translate-y-0.5 hover:border-ligne-forte', className)} {...props} />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pb-0 pt-5', className)} {...props} />
})

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle({ className, ...props }, ref) {
  return <h2 ref={ref} className={cn('text-[15px] font-semibold leading-tight tracking-[-0.01em]', className)} {...props} />
})

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('mt-1 max-w-3xl text-[13px] leading-[1.55] text-gris', className)} {...props} />
})

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5', className)} {...props} />
})

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-wrap items-center gap-3 border-t border-ligne px-5 py-3', className)} {...props} />
})
