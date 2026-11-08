/**
 * Adapté de Lightswind UI — « seasonal-hover-cards » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : carte éditoriale plein cadre (image + dégradé encre en pied), titre Cormorant en nacre,
 * détails qui remontent au survol (toujours visibles au tactile), lien réel, emplacement libre en haut (favori, mention).
 * Pas de largeur qui change au survol (la grille reste stable) ; seuls transform et opacity sont animés.
 * Les détails tiennent sur une ligne (h-10).
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function SeasonCard({ vers, labelLien, image, surtitre, titre, details, haut, className, grand, clair }: {
  vers: string; labelLien: string; image: ReactNode; surtitre?: ReactNode; titre: ReactNode; details?: ReactNode
  haut?: ReactNode; className?: string; grand?: boolean
  /** Objet seul sur fond clair (packshot) : pas de dégradé, texte encre. */
  clair?: boolean
}) {
  return (
    <article className={cn('group relative isolate overflow-hidden rounded-[6px] bg-sable-100 shadow-carte transition-transform duration-700 ease-maison hover:-translate-y-1', className)}>
      <Link to={vers} aria-label={labelLien}
        className="absolute inset-0 z-[3] rounded-[6px] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-nacre" />
      {image}
      {!clair && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-encre/90 via-encre/45 to-transparent" />}
      {/* Bloc texte : au repos, il descend de la hauteur des détails (h-10) ; au survol, il remonte et les détails apparaissent. */}
      <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-[2] transition-transform duration-700 ease-maison', clair ? 'text-encre' : 'text-nacre',
        details && '[@media(hover:hover)]:translate-y-10 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-focus-within:translate-y-0',
        grand ? 'p-7 sm:p-9' : 'p-3 sm:p-5')}>
        {surtitre && <p className={cn('text-[10px] font-medium uppercase tracking-large', clair ? 'text-bronze' : 'text-or-clair')}>{surtitre}</p>}
        <h3 className={cn('mt-1.5 font-display leading-[1.12] equilibre', grand ? 'text-[clamp(1.9rem,3vw,2.6rem)]' : 'text-[19px] sm:text-[21px]')}>{titre}</h3>
        {details && (
          <div className="flex h-10 items-end transition-opacity duration-700 ease-maison [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
            {details}
          </div>
        )}
      </div>
      {haut && <div className="absolute inset-x-0 top-0 z-[4] flex items-start justify-between p-3 sm:p-4 [&>*]:pointer-events-auto pointer-events-none">{haut}</div>}
    </article>
  )
}
