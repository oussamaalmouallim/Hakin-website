import { ArrowRight, Heart } from 'lucide-react'
import { ImageProduit, PastillesColoris, Prix } from '@/design-system'
import { SeasonCard } from '@/components/lightswind/seasonal-hover-cards'
import { useFavoris } from '@/state/favoris'
import { estPackshot } from '@/lib/catalogue'
import { cn } from '@/lib/utils'
import type { Produit } from '@/lib/types'

/** Carte produit (Lightswind seasonal-hover-cards) : image plein cadre, marque et nom sur l'image, prix et coloris au survol. */
export function CarteProduit({ produit, prioritaire, className }: { produit: Produit; prioritaire?: boolean; className?: string }) {
  const favori = useFavoris(s => s.slugs.includes(produit.slug))
  const basculer = useFavoris(s => s.basculer)
  const [img1, img2] = produit.images
  const packshot = estPackshot(produit)
  const mention = produit.disponibilite === 'epuise' ? 'Épuisé' : produit.nouveau ? 'Nouveau' : null
  // Packshot : carte claire, l'objet est remonté au-dessus du texte.
  const zone = packshot ? 'absolute inset-x-0 top-0 bottom-[22%]' : 'absolute inset-0'
  return (
    <SeasonCard clair={packshot} className={cn('aspect-[4/5] bg-sable-50', className)} vers={`/produit/${produit.slug}`} labelLien={`${produit.nom} — ${produit.marque}`}
      image={<>
        <ImageProduit src={img1.src} alt="" prioritaire={prioritaire} zoomSurvol packshot={packshot}
          className={cn(zone, img2 && 'transition-opacity duration-700 ease-maison group-hover:opacity-0')} />
        {img2 && <ImageProduit src={img2.src} alt="" packshot={packshot} className={cn(zone, 'opacity-0 transition-opacity duration-700 ease-maison group-hover:opacity-100')} />}
      </>}
      surtitre={produit.marque}
      titre={produit.nom}
      details={
        <span className="flex w-full items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <Prix prixDH={produit.prixDH} prixBarreDH={produit.prixBarreDH} className={packshot ? 'text-gris' : 'text-nacre/85'} />
            <span className="hidden sm:block"><PastillesColoris coloris={produit.coloris} /></span>
          </span>
          <ArrowRight className={cn('hidden h-4 w-4 shrink-0 sm:block', packshot ? 'text-bronze' : 'text-or-clair')} strokeWidth={1.25} aria-hidden />
        </span>
      }
      haut={<>
        {mention ? <span className="rounded-full bg-nacre/85 px-3 py-1 text-[10px] font-medium uppercase tracking-large text-encre backdrop-blur">{mention}</span> : <span />}
        <button type="button" onClick={() => basculer(produit.slug)} aria-pressed={favori}
          aria-label={favori ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
          className="grid h-9 w-9 place-items-center rounded-full bg-nacre/80 backdrop-blur transition-[opacity,transform] duration-500 ease-maison hover:scale-105 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100 aria-pressed:!opacity-100">
          <Heart className={cn('h-4 w-4 transition-colors', favori ? 'fill-bronze text-bronze' : 'text-encre')} strokeWidth={1.25} />
        </button>
      </>}
    />
  )
}
