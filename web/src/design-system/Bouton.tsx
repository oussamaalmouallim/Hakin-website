import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** cloneme: C-08 — boutons pilule de la référence : mono 11 px capitales, interlettrage .18em, rayon plein ;
 *  `accent` = gros bouton jaune Archivo Black (« Acheter » de l'appel final). */
export const styleBouton = cva(
  'group/bouton relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-full font-mono text-[11px] font-normal uppercase tracking-[0.18em] transition-[color,background-color,border-color,transform,opacity] duration-200 ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variante: {
        plein: 'bg-encre text-fond hover:bg-encre-douce',
        contour: 'border border-encre text-encre hover:bg-encre hover:text-fond',
        clair: 'bg-fond text-encre hover:bg-blanc',
        'contour-clair': 'border border-fond/40 text-fond hover:bg-fond hover:text-encre',
        accent: 'bg-accent font-display text-[13px] tracking-[0.08em] text-encre hover:bg-accent-doux',
        texte: 'px-0 text-encre underline-offset-[6px] hover:underline',
        whatsapp: 'border border-ligne-forte bg-blanc text-encre hover:border-encre',
      },
      taille: { sm: 'h-9 px-4', md: 'h-11 px-6', lg: 'h-14 px-9', icone: 'h-11 w-11 p-0' },
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
export function BoutonExterne({ className, variante, taille, plein_largeur, icone, children, href, onClick }: Variantes & { href: string; icone?: ReactNode; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cn(styleBouton({ variante, taille, plein_largeur }), className)}>
      {icone}{children}
    </a>
  )
}
