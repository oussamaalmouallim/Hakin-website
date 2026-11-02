import { estCommandable, trouverProduit } from '@/lib/catalogue'
import { QTE_MAX, QTE_MIN, cleLigne } from '@/state/panier'
import type { LignePanier } from '@/lib/types'

/** « Commander directement » : la pièce choisie va au checkout par l'adresse (`/commande?article=…`), sans toucher au panier.
 *  L'adresse survit à l'actualisation ; elle est revalidée à chaque lecture (variante disponible, quantité bornée). */
export function lienCommandeDirecte(slug: string, coloris: string, taille: string, quantite: number) {
  const q = new URLSearchParams({ article: slug, coloris, taille, qte: String(quantite) })
  return `/commande?${q}`
}

/** Ligne de la commande directe, ou `null` si l'adresse ne désigne pas une variante commandable. */
export function ligneDirecte(sp: URLSearchParams): LignePanier | null {
  const slug = sp.get('article')
  if (!slug) return null
  const p = trouverProduit(slug)
  const coloris = sp.get('coloris') ?? ''
  const taille = sp.get('taille') ?? ''
  const qte = Number(sp.get('qte') ?? '1')
  if (!p || !estCommandable(p)) return null
  if (!p.coloris.some(c => c.nom === coloris)) return null
  if (!p.tailles.some(t => t.taille === taille && t.disponible)) return null
  if (!Number.isInteger(qte) || qte < QTE_MIN || qte > QTE_MAX) return null
  return { cle: cleLigne(slug, coloris, taille), slug, coloris, taille, quantite: qte }
}
