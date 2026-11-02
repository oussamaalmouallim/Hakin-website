import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'
import { ImageProduit, PastillesColoris, Prix } from '@/design-system'
import { useFavoris } from '@/state/favoris'
import { estPackshot, trouverCategorie } from '@/lib/catalogue'
import { cn } from '@/lib/utils'
import type { Produit } from '@/lib/types'

/** Pastilles de la référence : `tag-hot` (jaune) et `tag-sale` (rouge). Données réelles uniquement. */
function pastilles(p: Produit) {
  const l: { texte: string; ton: 'jaune' | 'rouge' }[] = []
  if (p.disponibilite === 'epuise') l.push({ texte: 'Épuisé', ton: 'rouge' })
  if (p.nouveau) l.push({ texte: 'Nouveau', ton: 'jaune' })
  if (p.misEnAvant) l.push({ texte: 'À la une', ton: 'jaune' })
  return l.slice(0, 2)
}

/** Disque derrière la pièce : ses deux premiers coloris en diagonale (référence : `linear-gradient(135deg, c1 50%, c2 50%)`). */
function fondDisque(p: Produit) {
  const [a, b] = p.coloris.map(c => c.hex)
  if (!a) return 'var(--beige)'
  return `linear-gradient(135deg, ${a} 50%, ${b ?? a} 50%)`
}

/**
 * cloneme: C-09, A-01, A-02, A-03, A-04 — carte produit de la référence (`article`, Relevé) :
 * bordure 1 px, rayon 20 px, zone image carrée sur `--fond-2`, disque coloré, pastilles mono en haut à gauche,
 * cœur 36 px en haut à droite, texte `px-[18px] pt-4 pb-[18px]`, montée de 6 px + ombre au survol (350 ms).
 * `numero` = variante « meilleures ventes » de l'accueil (`.ml-card`) : grand chiffre en creux, disque uni qui grossit,
 * image qui pivote de -3°, bouton noir qui monte au survol.
 * Adaptation H MODE : photos sans fond détouré → elles remplissent la zone image ; le bouton rapide mène au choix de la taille.
 */
export function CarteProduit({ produit, prioritaire, className, numero }: { produit: Produit; prioritaire?: boolean; className?: string; numero?: number }) {
  const favori = useFavoris(s => s.slugs.includes(produit.slug))
  const basculer = useFavoris(s => s.basculer)
  const vedette = numero !== undefined
  const detoure = estPackshot(produit)
  const [img1] = produit.images
  const vers = `/produit/${produit.slug}`
  const categorie = trouverCategorie(produit.categorie)?.nom ?? produit.categorie
  return (
    <article className={cn('group relative flex min-w-0 flex-col overflow-hidden rounded-carte border border-ligne bg-fond text-encre transition-all duration-[350ms] ease-standard hover:-translate-y-1.5 hover:shadow-carte', className)}>
      <Link to={vers} tabIndex={-1} aria-hidden className="block">
        <div className="relative isolate flex aspect-square items-center justify-center overflow-hidden bg-fond-2">
          {detoure && (
            <div aria-hidden className={cn('absolute left-1/2 top-1/2 z-0 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500',
              vedette ? 'h-[62%] w-[62%] opacity-[0.24] group-hover:scale-[1.14] group-hover:opacity-[0.36]' : 'opacity-20')}
              style={{ background: vedette ? produit.coloris[0]?.hex ?? 'var(--beige)' : fondDisque(produit) }} />
          )}
          <ImageProduit src={img1.src} alt="" prioritaire={prioritaire} packshot={detoure} tailles="(min-width: 1024px) 25vw, 50vw"
            className="absolute inset-0"
            classeImage={cn('!duration-500 ease-standard', vedette ? 'group-hover:rotate-[-3deg] group-hover:scale-105' : !detoure && 'group-hover:scale-[1.03]')} />
          {vedette && (
            <span aria-hidden className="titre-contour absolute left-[14px] top-[14px] z-[2] font-display text-[46px] leading-[0.9] tracking-[-0.02em]">{String(numero).padStart(2, '0')}</span>
          )}
          {!vedette && pastilles(produit).map((t, i) => (
            <span key={t.texte} style={{ top: 10 + i * 28 }}
              className={cn('absolute left-2.5 z-[2] rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]', t.ton === 'rouge' ? 'bg-danger text-blanc' : 'bg-accent text-encre')}>{t.texte}</span>
          ))}
        </div>
      </Link>
      <button type="button" onClick={() => basculer(produit.slug)} aria-pressed={favori}
        aria-label={favori ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
        className={cn('absolute z-[2] grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-all duration-150 hover:bg-danger hover:text-blanc',
          vedette ? 'right-[14px] top-[14px]' : 'right-3 top-3', favori ? 'bg-encre text-fond' : 'bg-fond/90 text-encre')}>
        <Heart className={cn('h-3.5 w-3.5', favori && 'fill-current')} strokeWidth={1.8} />
      </button>
      <Link to={vers} className="flex flex-1 flex-col gap-1 px-[18px] pb-[18px] pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gris">{produit.marque}</span>
        <span className="font-display text-[15px] leading-snug tracking-[0.01em]">{produit.nom}</span>
        {!vedette && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gris">{categorie}{produit.coloris.length > 1 && ` · ${produit.coloris.length} coloris`}</span>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Prix prixDH={produit.prixDH} prixBarreDH={produit.prixBarreDH} />
          <PastillesColoris coloris={produit.coloris} max={3} />
        </div>
      </Link>
      {vedette && (
        <Link to={vers} tabIndex={-1} className="ml-rapide absolute bottom-3.5 left-3.5 right-3.5 z-[2] flex items-center justify-between rounded-full bg-encre px-[18px] py-[11px] font-display text-[11px] uppercase tracking-[0.14em] text-fond">
          Choisir la taille<ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      )}
    </article>
  )
}
