import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { srcImage, srcsetImage } from '@/lib/catalogue'
import { cn } from '@/lib/utils'

/** Image produit WebP responsive : fondu à l'arrivée, état d'erreur propre. `packshot` = objet seul (chaussure) centré avec de l'air, fond blanc fondu dans le sable. */
export function ImageProduit({ src, alt, className, prioritaire, tailles = '(min-width: 1024px) 25vw, 50vw', zoomSurvol, packshot }: {
  src: string; alt: string; className?: string; prioritaire?: boolean; tailles?: string; zoomSurvol?: boolean; packshot?: boolean
}) {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'erreur'>('charge')
  return (
    <div className={cn('relative overflow-hidden bg-sable-50', className)}>
      {etat === 'erreur' ? (
        <div className="absolute inset-0 grid place-items-center text-gris-clair"><ImageOff className="h-6 w-6" strokeWidth={1} aria-label="Image indisponible" /></div>
      ) : (
        <img src={srcImage(src)} srcSet={srcsetImage(src)} sizes={tailles} alt={alt}
          loading={prioritaire ? 'eager' : 'lazy'} {...{ fetchpriority: prioritaire ? 'high' : 'auto' }} decoding="async"
          onLoad={() => setEtat('ok')} onError={() => setEtat('erreur')}
          className={cn('h-full w-full transition-[opacity,transform] duration-[1200ms] ease-maison',
            packshot ? 'object-contain p-[13%] mix-blend-multiply' : 'object-cover',
            etat === 'ok' ? 'opacity-100' : 'opacity-0', zoomSurvol && 'group-hover:scale-[1.035]')} />
      )}
    </div>
  )
}
