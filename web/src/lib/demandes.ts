import { obtenirSupabase, supabaseActif } from '@/lib/supabase'

/** Demande de renseignement par WhatsApp, notée au clic pour que la boutique la suive dans l'admin (« Demandes »).
 *  Ce n'est pas une commande : on sait que WhatsApp a été ouvert, pas que le message est parti. Rien de personnel n'est
 *  envoyé ; la base relit le nom et le prix de la pièce et limite les envois. N'empêche jamais l'ouverture de WhatsApp. */
export type MotifDemande = 'renseignement' | 'commande' | 'alerte_stock' | 'conseil_taille'

export function noterDemande(motif: MotifDemande, slug: string, choix: { coloris?: string | null; taille?: string | null } = {}) {
  if (!supabaseActif) return
  void obtenirSupabase()
    .then(sb => sb?.rpc('noter_demande_whatsapp', { demande: { motif, slug, coloris: choix.coloris ?? '', taille: choix.taille ?? '' } }))
    .catch(() => undefined)
}
