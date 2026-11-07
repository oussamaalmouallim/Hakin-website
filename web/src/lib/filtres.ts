import type { Produit } from './types'

export type Tri = 'pertinence' | 'nouveautes' | 'prix-croissant' | 'prix-decroissant' | 'nom'
/** Étiquettes de la référence (« Tags ») tirées des données : nouveauté, mise en avant. */
export type Etiquette = 'nouveau' | 'une'
/** Rayons du menu de la référence (`/shop?g=men`, `?g=women`, `?sale=1`) : contexte de la page, pas des filtres à cocher. */
export type Genre = 'homme' | 'femme'

export interface Filtres {
  categories: string[]
  marques: string[]
  coloris: string[]
  tailles: string[]
  collections: string[]
  etiquettes: Etiquette[]
  disponibles: boolean
  /** Prix maximum (curseur « Prix max » de la référence) ; null = pas de limite. */
  prixMax: number | null
  tri: Tri
  genre: Genre | null
  /** Seulement les pièces en solde (prix barré supérieur au prix). */
  solde: boolean
}

export const FILTRES_VIDES: Filtres = { categories: [], marques: [], coloris: [], tailles: [], collections: [], etiquettes: [], disponibles: false, prixMax: null, tri: 'pertinence', genre: null, solde: false }

const aEtiquette = (p: Produit, e: Etiquette) => (e === 'nouveau' ? p.nouveau : p.misEnAvant)
export const estEnSolde = (p: Produit) => p.prixDH !== null && p.prixBarreDH !== null && p.prixBarreDH > p.prixDH

export function appliquerFiltres(liste: Produit[], f: Filtres): Produit[] {
  const res = liste.filter(p =>
    (!f.genre || p.genre === f.genre || p.genre === 'mixte') &&
    (!f.solde || estEnSolde(p)) &&
    (!f.categories.length || f.categories.includes(p.categorie)) &&
    (!f.etiquettes.length || f.etiquettes.some(e => aEtiquette(p, e))) &&
    (f.prixMax === null || (p.prixDH !== null && p.prixDH <= f.prixMax)) &&
    (!f.marques.length || f.marques.includes(p.marque)) &&
    (!f.coloris.length || p.coloris.some(c => f.coloris.includes(c.nom))) &&
    (!f.tailles.length || p.tailles.some(t => t.disponible && f.tailles.includes(t.taille))) &&
    (!f.collections.length || p.collections.some(c => f.collections.includes(c))) &&
    (!f.disponibles || p.disponibilite === 'disponible'))
  const prix = (p: Produit) => p.prixDH ?? Number.POSITIVE_INFINITY // « prix sur demande » toujours en fin de liste
  switch (f.tri) {
    case 'prix-croissant': return [...res].sort((a, b) => prix(a) - prix(b))
    case 'prix-decroissant': return [...res].sort((a, b) => (b.prixDH ?? -1) - (a.prixDH ?? -1))
    case 'nom': return [...res].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    case 'nouveautes': return [...res].sort((a, b) => Number(b.nouveau) - Number(a.nouveau))
    default: return [...res].sort((a, b) => Number(b.misEnAvant) - Number(a.misEnAvant))
  }
}

/** Valeurs proposées dans le panneau, avec le nombre de produits correspondants. */
const ORDRE_TAILLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

export function facettes(liste: Produit[]) {
  const compter = (vals: string[]) => [...new Set(vals)].map(v => ({ valeur: v, n: vals.filter(x => x === v).length }))
  return {
    categories: compter(liste.map(p => p.categorie)),
    etiquettes: (['nouveau', 'une'] as Etiquette[]).map(e => ({ valeur: e, n: liste.filter(p => aEtiquette(p, e)).length })),
    /** Bornes du curseur de prix (null si aucun prix n'est renseigné : curseur masqué). */
    prix: liste.some(p => p.prixDH !== null)
      ? { min: Math.min(...liste.flatMap(p => (p.prixDH === null ? [] : [p.prixDH]))), max: Math.max(...liste.flatMap(p => (p.prixDH === null ? [] : [p.prixDH]))) }
      : null,
    marques: compter(liste.map(p => p.marque)).sort((a, b) => a.valeur.localeCompare(b.valeur)),
    coloris: compter(liste.flatMap(p => p.coloris.map(c => c.nom))).sort((a, b) => b.n - a.n),
    collections: compter(liste.flatMap(p => p.collections)),
    tailles: compter(liste.flatMap(p => p.tailles.filter(t => t.disponible).map(t => t.taille)))
      .sort((a, b) => ORDRE_TAILLES.indexOf(a.valeur) - ORDRE_TAILLES.indexOf(b.valeur)),
    /** Nombre de pièces réellement disponibles (le filtre est masqué s'il n'y en a aucune). */
    disponibles: liste.filter(p => p.disponibilite === 'disponible').length,
    /** Au moins un prix renseigné (sinon le tri par prix n'a pas de sens). */
    avecPrix: liste.some(p => p.prixDH !== null),
  }
}

/** Facettes croisées : chaque groupe compte les pièces qui passent tous les AUTRES filtres
 *  (les valeurs restent listées, à 0 si la combinaison ne donne rien). */
export function facettesCroisees(base: Produit[], f: Filtres) {
  const toutes = facettes(base)
  const recompter = (valeurs: { valeur: string }[], n: { valeur: string; n: number }[]) =>
    valeurs.map(v => ({ valeur: v.valeur, n: n.find(x => x.valeur === v.valeur)?.n ?? 0 }))
  return {
    ...toutes,
    categories: recompter(toutes.categories, facettes(appliquerFiltres(base, { ...f, categories: [] })).categories),
    etiquettes: recompter(toutes.etiquettes, facettes(appliquerFiltres(base, { ...f, etiquettes: [] })).etiquettes) as { valeur: Etiquette; n: number }[],
    marques: recompter(toutes.marques, facettes(appliquerFiltres(base, { ...f, marques: [] })).marques),
    coloris: recompter(toutes.coloris, facettes(appliquerFiltres(base, { ...f, coloris: [] })).coloris),
    collections: recompter(toutes.collections, facettes(appliquerFiltres(base, { ...f, collections: [] })).collections),
    tailles: recompter(toutes.tailles, facettes(appliquerFiltres(base, { ...f, tailles: [] })).tailles),
    disponibles: facettes(appliquerFiltres(base, { ...f, disponibles: false })).disponibles,
  }
}

/** Filtres <-> paramètres d'URL (partage d'un lien filtré). */
export function filtresDepuisURL(sp: URLSearchParams): Filtres {
  const liste = (k: string) => sp.get(k)?.split(',').filter(Boolean) ?? []
  const tri = sp.get('tri') as Tri | null
  const max = Number(sp.get('prixmax'))
  return { categories: liste('categorie'), marques: liste('marque'), coloris: liste('coloris'), tailles: liste('taille'), collections: liste('collection'),
    etiquettes: liste('tag').filter((e): e is Etiquette => e === 'nouveau' || e === 'une'),
    disponibles: sp.get('dispo') === '1', prixMax: Number.isFinite(max) && max > 0 ? max : null,
    tri: tri && ['nouveautes', 'prix-croissant', 'prix-decroissant', 'nom'].includes(tri) ? tri : 'pertinence',
    genre: sp.get('genre') === 'homme' || sp.get('genre') === 'femme' ? sp.get('genre') as Genre : null, solde: sp.get('solde') === '1' }
}

export function filtresVersURL(f: Filtres): URLSearchParams {
  const sp = new URLSearchParams()
  if (f.genre) sp.set('genre', f.genre)
  if (f.solde) sp.set('solde', '1')
  if (f.categories.length) sp.set('categorie', f.categories.join(','))
  if (f.marques.length) sp.set('marque', f.marques.join(','))
  if (f.coloris.length) sp.set('coloris', f.coloris.join(','))
  if (f.tailles.length) sp.set('taille', f.tailles.join(','))
  if (f.collections.length) sp.set('collection', f.collections.join(','))
  if (f.etiquettes.length) sp.set('tag', f.etiquettes.join(','))
  if (f.disponibles) sp.set('dispo', '1')
  if (f.prixMax !== null) sp.set('prixmax', String(f.prixMax))
  if (f.tri !== 'pertinence') sp.set('tri', f.tri)
  return sp
}

export const nbFiltresActifs = (f: Filtres) =>
  f.categories.length + f.etiquettes.length + Number(f.prixMax !== null) + f.marques.length + f.coloris.length + f.tailles.length + f.collections.length + Number(f.disponibles)
