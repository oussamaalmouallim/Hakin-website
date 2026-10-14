import type { Produit } from './types'

export type Tri = 'pertinence' | 'prix-croissant' | 'prix-decroissant' | 'nom'

export interface Filtres {
  marques: string[]
  coloris: string[]
  tailles: string[]
  collections: string[]
  disponibles: boolean
  tri: Tri
}

export const FILTRES_VIDES: Filtres = { marques: [], coloris: [], tailles: [], collections: [], disponibles: false, tri: 'pertinence' }

export function appliquerFiltres(liste: Produit[], f: Filtres): Produit[] {
  const res = liste.filter(p =>
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
    default: return [...res].sort((a, b) => Number(b.misEnAvant) - Number(a.misEnAvant))
  }
}

/** Valeurs proposées dans le panneau, avec le nombre de produits correspondants. */
const ORDRE_TAILLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

export function facettes(liste: Produit[]) {
  const compter = (vals: string[]) => [...new Set(vals)].map(v => ({ valeur: v, n: vals.filter(x => x === v).length }))
  return {
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
  return { marques: liste('marque'), coloris: liste('coloris'), tailles: liste('taille'), collections: liste('collection'),
    disponibles: sp.get('dispo') === '1', tri: tri && ['prix-croissant', 'prix-decroissant', 'nom'].includes(tri) ? tri : 'pertinence' }
}

export function filtresVersURL(f: Filtres): URLSearchParams {
  const sp = new URLSearchParams()
  if (f.marques.length) sp.set('marque', f.marques.join(','))
  if (f.coloris.length) sp.set('coloris', f.coloris.join(','))
  if (f.tailles.length) sp.set('taille', f.tailles.join(','))
  if (f.collections.length) sp.set('collection', f.collections.join(','))
  if (f.disponibles) sp.set('dispo', '1')
  if (f.tri !== 'pertinence') sp.set('tri', f.tri)
  return sp
}

export const nbFiltresActifs = (f: Filtres) =>
  f.marques.length + f.coloris.length + f.tailles.length + f.collections.length + Number(f.disponibles)
