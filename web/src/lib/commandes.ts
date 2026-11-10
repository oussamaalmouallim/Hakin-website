import { obtenirSupabase } from '@/lib/supabase'
import { signalerErreur } from '@/lib/supervision'
import type { CoordonneesClient } from '@/lib/types'

/** Ligne de commande telle qu'enregistrée : prix du catalogue au moment de la commande. */
export interface LigneACommander { slug: string; nom: string; coloris: string; taille: string; quantite: number; prixDH: number }

export type ResultatEnregistrement =
  | { statut: 'enregistree'; reference: string }
  | { statut: 'sans_serveur' } // site sans Supabase (clone sans .env, tests) : commande par WhatsApp seulement
  | { statut: 'erreur'; message: string }

/** Enregistre la commande dans Supabase par la fonction `passer_commande` (une transaction, compte rattaché côté base,
 *  paiement à la livraison imposé). Ne simule jamais une réussite : sans serveur, on le dit. */
export async function enregistrerCommande(reference: string, client: CoordonneesClient, lignes: LigneACommander[]): Promise<ResultatEnregistrement> {
  const sb = await obtenirSupabase()
  if (!sb) return { statut: 'sans_serveur' }
  const { data, error, status } = await sb.rpc('passer_commande', { commande: {
    reference,
    client: { nom: client.nom.trim(), telephone: client.telephone.trim(), email: client.email.trim(), ville: client.ville, adresse: client.adresse.trim(), instructions: client.instructions.trim() },
    lignes: lignes.map(l => ({ slug: l.slug, nom: l.nom, coloris: l.coloris, taille: l.taille, quantite: l.quantite, prix_dh: l.prixDH })),
  } })
  // 429 = limite de commandes atteinte pour ce visiteur (la base répond « trop de requêtes ») : rien n'est enregistré.
  // null sans erreur = même cas, ancienne réponse de la base (avant la migration du 10/11).
  if (status === 429 || (!error && data === null)) return { statut: 'erreur', message: 'Trop de commandes envoyées depuis cet appareil en peu de temps. Réessayez dans une heure, ou écrivez-nous sur WhatsApp.' }
  if (error) {
    console.warn('[commande] enregistrement refusé :', error.message)
    signalerErreur('api', `Commande refusée : ${error.code ?? ''} ${error.message}`)
    return { statut: 'erreur', message: /fetch|network/i.test(error.message)
      ? 'Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.'
      : 'Votre commande n\'a pas pu être enregistrée. Réessayez, ou envoyez-la directement sur WhatsApp.' }
  }
  return { statut: 'enregistree', reference: String(data) }
}
