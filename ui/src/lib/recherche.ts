import { sansAccents } from './format'
import type { Produit } from './types'

/** Tous les mots de la requête doivent apparaître (sans accents ni casse) dans le nom, la marque, la catégorie, les coloris ou la description. */
export function rechercher(liste: Produit[], requete: string): Produit[] {
  const mots = sansAccents(requete).split(/\s+/).filter(Boolean)
  if (!mots.length) return []
  return liste.filter(p => {
    const texte = sansAccents([p.nom, p.marque, p.categorie, p.description, ...p.coloris.map(c => c.nom)].join(' '))
    return mots.every(m => texte.includes(m))
  })
}
