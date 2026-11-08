import { boutique } from './catalogue'
import { formatDH } from './format'
import type { CoordonneesClient } from './types'

export const lienWhatsApp = (message?: string) =>
  `https://wa.me/${boutique.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export interface LigneMessage { nom: string; coloris: string; taille: string; quantite: number; prixDH: number }

export function messageCommande(reference: string, lignes: LigneMessage[], client: CoordonneesClient) {
  const total = lignes.reduce((s, l) => s + l.prixDH * l.quantite, 0)
  return [
    `Bonjour H MODE, je souhaite passer commande (réf. ${reference}) :`,
    '',
    ...lignes.map(l => `• ${l.nom} — ${l.coloris}, taille ${l.taille} × ${l.quantite} = ${formatDH(l.prixDH * l.quantite)}`),
    '',
    `Sous-total : ${formatDH(total)} (livraison à confirmer)`,
    `Mode de paiement : ${boutique.paiement}`,
    '',
    `Nom : ${client.nom}`,
    `Téléphone : ${client.telephone}`,
    ...(client.email ? [`E-mail : ${client.email}`] : []),
    `Ville : ${client.ville}`,
    `Adresse : ${client.adresse}`,
    ...(client.instructions ? [`Instructions : ${client.instructions}`] : []),
  ].join('\n')
}

/** Message de demande depuis une fiche : pièce, coloris et taille choisis, lien de la fiche, question claire.
 *  Le prix n'est demandé que s'il n'est pas affiché. */
export function messageProduit(p: { nom: string; marque?: string; prixConnu?: boolean }, opts: { coloris?: string; taille?: string; lien?: string; motif?: 'renseignement' | 'commande' | 'alerte_stock' } = {}) {
  const nom = p.marque ? `${p.marque} — ${p.nom}` : p.nom
  const question = opts.motif === 'commande' ? 'Je souhaite la commander. Est-elle disponible ?'
    : opts.motif === 'alerte_stock' ? 'Elle est indiquée épuisée : pouvez-vous me prévenir si elle revient ?'
    : p.prixConnu ? 'Est-elle disponible ?' : 'Est-elle disponible, et à quel prix ?'
  return [
    `Bonjour H MODE, je souhaite avoir des informations sur ce produit : ${nom}.`,
    ...(opts.coloris ? [`Couleur : ${opts.coloris}.`] : []),
    ...(opts.taille ? [`Taille : ${opts.taille}.`] : []),
    ...(opts.lien ? [`Lien : ${opts.lien}`] : []),
    question,
  ].join('\n')
}

export function messageContact(c: { nom: string; telephone: string; sujet: string; message: string }) {
  return `Bonjour H MODE, je m'appelle ${c.nom} (${c.telephone}).${c.sujet ? `\nSujet : ${c.sujet}` : ''}\n${c.message}`.trim()
}
