import { sansAccents } from './format'
import { categoriesActives } from './catalogue'
import type { Produit } from './types'

/** Minuscules, sans accents, ponctuation → espace (« T-shirt » = « t shirt »). */
const normaliser = (s: string) => sansAccents(s).replace(/[^a-z0-9]+/g, ' ').trim()
const mots = (requete: string) => normaliser(requete).split(' ').filter(Boolean)
/** Un mot est trouvé dans le texte tel quel, ou dans le texte sans espaces (« tshirt » trouve « t shirt »). */
const contient = (texte: string, mot: string) => texte.includes(mot) || texte.replace(/ /g, '').includes(mot)

const nomCategorie = (slug: string) => categoriesActives().find(c => c.slug === slug)?.nom ?? slug

/** Tous les mots de la requête doivent apparaître dans le nom, la marque, la catégorie (slug et nom), les coloris ou la description.
 *  Classement : nom, puis marque, puis catégorie, puis coloris, puis description ; à égalité, l'ordre du catalogue. */
export function rechercher(liste: Produit[], requete: string): Produit[] {
  const m = mots(requete)
  if (!m.length) return []
  const notes = liste.flatMap((p, i) => {
    const champs: [string, number][] = [
      [normaliser(p.nom), 8], [normaliser(p.marque), 6], [normaliser(`${p.categorie} ${nomCategorie(p.categorie)}`), 4],
      [normaliser(p.coloris.map(c => c.nom).join(' ')), 2], [normaliser(p.description), 1],
    ]
    let note = 0
    for (const mot of m) {
      const poids = champs.filter(([t]) => contient(t, mot)).map(([, w]) => w)
      if (!poids.length) return []
      note += Math.max(...poids)
    }
    return [{ p, note, i }]
  })
  return notes.sort((a, b) => b.note - a.note || a.i - b.i).map(x => x.p)
}

/** Raccourcis de la recherche : marques et types de vêtement dont le nom contient tous les mots saisis (vers la boutique filtrée). */
export function suggestions(liste: Produit[], requete: string) {
  const m = mots(requete)
  if (!m.length) return { marques: [], categories: [] }
  const ok = (texte: string) => { const t = normaliser(texte); return m.every(x => contient(t, x)) }
  const marques = [...new Set(liste.map(p => p.marque))].filter(ok).sort((a, b) => a.localeCompare(b, 'fr'))
    .map(nom => ({ libelle: nom, vers: `/boutique?marque=${encodeURIComponent(nom)}`, n: liste.filter(p => p.marque === nom).length }))
  const categories = categoriesActives().filter(c => ok(`${c.slug} ${c.nom}`))
    .map(c => ({ libelle: c.nom, vers: `/boutique/${c.slug}`, n: liste.filter(p => p.categorie === c.slug).length }))
    .filter(c => c.n > 0)
  return { marques, categories }
}
