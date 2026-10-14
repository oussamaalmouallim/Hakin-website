import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const styleBouton = cva(
  'group/bouton relative inline-flex select-none items-center justify-center gap-3 overflow-hidden rounded-fin font-sans text-[11px] font-normal uppercase tracking-label transition-[color,background-color,border-color,transform,opacity] duration-500 ease-maison active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variante: {
        plein: 'bg-encre text-nacre hover:bg-bronze-fonce',
        contour: 'border border-encre/80 text-encre hover:bg-encre hover:text-nacre',
        clair: 'bg-nacre text-encre hover:bg-neige',
        'contour-clair': 'border border-nacre/70 text-nacre hover:bg-nacre hover:text-encre',
        texte: 'px-0 text-encre underline-offset-[6px] hover:underline',
        whatsapp: 'border border-encre/15 bg-neige text-encre hover:border-encre/40',
      },
      taille: { sm: 'h-10 px-5', md: 'h-12 px-8', lg: 'h-14 px-10', icone: 'h-11 w-11 p-0' },
      plein_largeur: { true: 'w-full' },
    },
    compoundVariants: [{ variante: 'texte', className: 'h-auto px-0' }],
    defaultVariants: { variante: 'plein', taille: 'md' },
  })

type Variantes = VariantProps<typeof styleBouton>

export interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Variantes {
  chargement?: boolean
  icone?: ReactNode
}

export const Bouton = forwardRef<HTMLButtonElement, BoutonProps>(function Bouton(
  { className, variante, taille, plein_largeur, chargement, icone, children, disabled, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || chargement} aria-busy={chargement || undefined}
      className={cn(styleBouton({ variante, taille, plein_largeur }), className)} {...rest}>
      {chargement ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icone}
      {children}
    </button>
  )
})

export function BoutonLien({ className, variante, taille, plein_largeur, icone, children, ...rest }: LinkProps & Variantes & { icone?: ReactNode }) {
  return <Link className={cn(styleBouton({ variante, taille, plein_largeur }), className)} {...rest}>{icone}{children}</Link>
}

/** Lien externe (WhatsApp, réseaux) : nouvel onglet sécurisé. */
export function BoutonExterne({ className, variante, taille, plein_largeur, icone, children, href }: Variantes & { href: string; icone?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(styleBouton({ variante, taille, plein_largeur }), className)}>
      {icone}{children}
    </a>
  )
}
