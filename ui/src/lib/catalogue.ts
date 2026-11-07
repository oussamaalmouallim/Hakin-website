import produitsJson from '@/data/produits.json'
import categoriesJson from '@/data/categories.json'
import collectionsJson from '@/data/collections.json'
import boutiqueJson from '@/data/boutique.json'
import fondsClairsJson from '@/data/fonds-clairs.json'
import type { Boutique, ReglagesBoutique, Categorie, Collection, Produit } from './types'
import { fusionnerBoutique, fusionnerTextes, type Textes } from './produitsBase'

/** Catalogue réel uniquement : un prix ou une taille absente reste `null` / vide (« Prix sur demande »).
 *  Départ : les fichiers de `src/data/`. Dès que la base répond (lot 20), `appliquerCatalogue` et `appliquerReglages`
 *  remplacent leur contenu SUR PLACE : tous les modules qui ont importé `produits` ou `boutique` voient les données à jour. */
export const produits: Produit[] = [...(produitsJson as Produit[])]
export const categories = categoriesJson as Categorie[]
export const collections = collectionsJson as Collection[]
const BOUTIQUE_FICHIER = boutiqueJson as Boutique
export const boutique: Boutique = structuredClone(BOUTIQUE_FICHIER)
export const textes: Textes = fusionnerTextes(null)
/** Coordonnées du fichier `boutique.json` : valeurs de départ des réglages de l'administration. */
export const boutiqueFichier = () => structuredClone(BOUTIQUE_FICHIER)
/** Produits du fichier, tels que livrés avec le site (import initial du catalogue dans l'administration). */
export const produitsFichier = () => structuredClone(produitsJson as Produit[])

export const categoriesActives = () => categories.filter(c => c.actif)
export const trouverProduit = (slug: string) => produits.find(p => p.slug === slug)
export const trouverCategorie = (slug: string) => categories.find(c => c.slug === slug && c.actif)
export const trouverCollection = (slug: string) => collections.find(c => c.slug === slug)
/** Teinte de chaque coloris, par nom (première occurrence du catalogue) : pastilles du panier, des filtres et des commandes. */
export const HEX_COLORIS: Record<string, string> = {}
const recalculerTeintes = () => {
  for (const k of Object.keys(HEX_COLORIS)) delete HEX_COLORIS[k]
  Object.assign(HEX_COLORIS, Object.fromEntries(produits.flatMap(p => p.coloris).reverse().map(c => [c.nom, c.hex])))
}
recalculerTeintes()

/** Remplace le catalogue par celui de la base (produits publiés, déjà triés). */
export function appliquerCatalogue(liste: Produit[]) {
  produits.splice(0, produits.length, ...liste)
  recalculerTeintes()
}
/** Remplace coordonnées, livraison, retours et textes par ceux de la base (champ absent = valeur du fichier). */
export function appliquerReglages(b: ReglagesBoutique | null, t: Partial<Textes> | null) {
  const nouveau = fusionnerBoutique(BOUTIQUE_FICHIER, b)
  for (const k of Object.keys(boutique)) delete (boutique as unknown as Record<string, unknown>)[k]
  Object.assign(boutique, nouveau)
  Object.assign(textes, fusionnerTextes(t))
}
export const produitsDeCollection = (slug: string) => produits.filter(p => p.collections.includes(slug))

/** Un produit va au panier seulement s'il a un prix réel et au moins une taille disponible. */
export const estCommandable = (p: Produit) =>
  p.prixDH !== null && p.disponibilite !== 'epuise' && p.tailles.some(t => t.disponible)

export function produitsLies(p: Produit, n = 4): Produit[] {
  const score = (q: Produit) => (q.collections.some(c => p.collections.includes(c)) ? 2 : 0) + (q.categorie === p.categorie ? 1 : 0)
  return produits.filter(q => q.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, n)
}

/** Photos sur fond clair uni, repérées par `npm run images` (src/data/fonds-clairs.json). */
const FONDS_CLAIRS = new Set<string>(fondsClairsJson as string[])
/** Photo d'objet seul sur fond clair (packshot) : affichée entière, centrée, détourée sur le disque de la carte. */
export const estPackshot = (p: Produit) => p.categorie === 'sneakers' || FONDS_CLAIRS.has(p.images[0]?.src)

/** srcset WebP à partir d'un chemin sans suffixe. */
export const srcImage = (src: string, l: 480 | 960 = 960) => `${src}-${l}.webp`
export const srcsetImage = (src: string) => `${src}-480.webp 480w, ${src}-960.webp 960w`
