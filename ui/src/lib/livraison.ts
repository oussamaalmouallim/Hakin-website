import { boutique } from './catalogue'
import type { Boutique } from './types'

/** Villes proposées dans les adresses et au moment de commander. */
export const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'El Jadida', 'Mohammédia', 'Autre ville']

/** Villes où la boutique livre (réglage de l'admin). `villes: null` = toutes les villes de la liste. */
export function villesLivrees(b: Boutique = boutique): string[] {
  const v = b.livraison.villes
  return v && v.length ? VILLES.filter(x => v.includes(x)) : VILLES
}

export const livraisonLimitee = (b: Boutique = boutique) => villesLivrees(b).length < VILLES.length

/** Liste lisible : « Casablanca », « Casablanca et Rabat », « Casablanca, Rabat et Fès ». */
export const listeVilles = (v: string[]) => v.length < 2 ? v.join('') : `${v.slice(0, -1).join(', ')} et ${v[v.length - 1]}`
