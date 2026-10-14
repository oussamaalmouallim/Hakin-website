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

export function messageProduit(nom: string, opts: { coloris?: string; taille?: string } = {}) {
  const details = [opts.coloris && `coloris ${opts.coloris}`, opts.taille && `taille ${opts.taille}`].filter(Boolean).join(', ')
  return `Bonjour H MODE, je suis intéressé(e) par « ${nom} »${details ? ` (${details})` : ''}. Pouvez-vous me confirmer le prix et la disponibilité ?`
}

export function messageContact(c: { nom: string; telephone: string; sujet: string; message: string }) {
  return `Bonjour H MODE, je m'appelle ${c.nom} (${c.telephone}).${c.sujet ? `\nSujet : ${c.sujet}` : ''}\n${c.message}`.trim()
}
