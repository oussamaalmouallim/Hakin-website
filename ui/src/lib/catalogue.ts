import produitsJson from '@/data/produits.json'
import demoJson from '@/data/produits.demo.json'
import categoriesJson from '@/data/categories.json'
import collectionsJson from '@/data/collections.json'
import boutiqueJson from '@/data/boutique.json'
import type { Boutique, Categorie, Collection, Produit } from './types'

/** Mode démo : prix et tailles FICTIFS pour tester le panier en local. Activé seulement par VITE_DEMO=1. */
export const MODE_DEMO = import.meta.env.VITE_DEMO === '1'

const demo = demoJson as Record<string, Partial<Produit>>
export const produits: Produit[] = (produitsJson as Produit[]).map(p =>
  MODE_DEMO && demo[p.slug] ? { ...p, ...demo[p.slug] } : p)
export const categories = categoriesJson as Categorie[]
export const collections = collectionsJson as Collection[]
export const boutique = boutiqueJson as Boutique

export const categoriesActives = () => categories.filter(c => c.actif)
export const trouverProduit = (slug: string) => produits.find(p => p.slug === slug)
export const trouverCategorie = (slug: string) => categories.find(c => c.slug === slug && c.actif)
export const trouverCollection = (slug: string) => collections.find(c => c.slug === slug)
export const produitsDeCollection = (slug: string) => produits.filter(p => p.collections.includes(slug))

/** Un produit va au panier seulement s'il a un prix réel et au moins une taille disponible. */
export const estCommandable = (p: Produit) =>
  p.prixDH !== null && p.disponibilite !== 'epuise' && p.tailles.some(t => t.disponible)

export function produitsLies(p: Produit, n = 4): Produit[] {
  const score = (q: Produit) => (q.collections.some(c => p.collections.includes(c)) ? 2 : 0) + (q.categorie === p.categorie ? 1 : 0)
  return produits.filter(q => q.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, n)
}

/** Photo d'objet seul (packshot) : affichée entière, centrée, sans recadrage. */
export const estPackshot = (p: Produit) => p.categorie === 'sneakers'

/** srcset WebP à partir d'un chemin sans suffixe. */
export const srcImage = (src: string, l: 480 | 960 = 960) => `${src}-${l}.webp`
export const srcsetImage = (src: string) => `${src}-480.webp 480w, ${src}-960.webp 960w`
