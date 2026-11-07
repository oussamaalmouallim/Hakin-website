import type { SupabaseClient } from '@supabase/supabase-js'
import { cleLigne } from '@/state/panier'
import type { Adresse } from '@/state/compte'
import type { CommandeEnvoyee, LignePanier } from '@/lib/types'

/** Lectures et écritures du compte dans Supabase (ADR 0005). La RLS limite chaque requête aux lignes du compte connecté :
 *  ces fonctions ne filtrent jamais elles-mêmes par utilisateur pour lire, la base le fait. Toute erreur est levée. */
const verifier = <T>({ data, error }: { data: T; error: { message: string } | null }) => { if (error) throw new Error(error.message); return data }

export interface Profil { nom: string; telephone: string; email: string }

export async function lireProfil(sb: SupabaseClient): Promise<Profil | null> {
  return verifier(await sb.from('profils').select('nom, telephone, email').maybeSingle()) as Profil | null
}
export async function ecrireProfil(sb: SupabaseClient, uid: string, p: Profil) {
  verifier(await sb.from('profils').update({ nom: p.nom.trim(), telephone: p.telephone.trim(), email: p.email.trim(), maj_le: new Date().toISOString() }).eq('id', uid))
}

/** Panier du compte : lignes {slug, coloris, taille, quantite} ; la clé est recalculée à la lecture. */
export async function lirePanier(sb: SupabaseClient): Promise<LignePanier[]> {
  const ligne = verifier(await sb.from('paniers').select('lignes').maybeSingle()) as { lignes: Omit<LignePanier, 'cle'>[] } | null
  return (ligne?.lignes ?? []).map(l => ({ ...l, cle: cleLigne(l.slug, l.coloris, l.taille) }))
}
export async function ecrirePanier(sb: SupabaseClient, uid: string, lignes: LignePanier[]) {
  const brut = lignes.map(({ slug, coloris, taille, quantite }) => ({ slug, coloris, taille, quantite }))
  verifier(await sb.from('paniers').upsert({ utilisateur: uid, lignes: brut, maj_le: new Date().toISOString() }))
}

/** Favoris du compte : une ligne par pièce, dans l'ordre d'ajout. */
export async function lireFavoris(sb: SupabaseClient): Promise<string[]> {
  const lignes = verifier(await sb.from('favoris').select('slug').order('cree_le')) as { slug: string }[] | null
  return (lignes ?? []).map(l => l.slug)
}
/** Ajoute les nouveaux favoris (les déjà présents sont ignorés) et retire ceux qui ont été enlevés. */
export async function ecrireFavoris(sb: SupabaseClient, uid: string, ajoutes: string[], retires: string[]) {
  if (retires.length) verifier(await sb.from('favoris').delete().in('slug', retires))
  if (ajoutes.length) verifier(await sb.from('favoris').upsert(ajoutes.map(slug => ({ utilisateur: uid, slug })), { onConflict: 'utilisateur,slug', ignoreDuplicates: true }))
}

interface LigneAdresse { id: string; libelle: string; ville: string; adresse: string; instructions: string; par_defaut: boolean }
export async function lireAdresses(sb: SupabaseClient): Promise<Adresse[]> {
  const lignes = verifier(await sb.from('adresses').select('id, libelle, ville, adresse, instructions, par_defaut').order('cree_le')) as LigneAdresse[]
  return (lignes ?? []).map(a => ({ id: a.id, libelle: a.libelle, ville: a.ville, adresse: a.adresse, instructions: a.instructions, parDefaut: a.par_defaut }))
}
/** Enregistre toutes les adresses (création ou mise à jour par id) et retire celles qui ont disparu. */
export async function ecrireAdresses(sb: SupabaseClient, uid: string, adresses: Adresse[], retirees: string[] = []) {
  if (retirees.length) verifier(await sb.from('adresses').delete().in('id', retirees))
  if (adresses.length) verifier(await sb.from('adresses').upsert(adresses.map(a => ({
    id: a.id, utilisateur: uid, libelle: a.libelle, ville: a.ville, adresse: a.adresse, instructions: a.instructions, par_defaut: a.parDefaut,
  }))))
}

interface LigneCommande {
  reference: string; cree_le: string; sous_total_dh: number
  nom: string; telephone: string; email: string; ville: string; adresse: string; instructions: string
  lignes_commande: { slug: string; nom: string; coloris: string; taille: string; quantite: number; prix_dh: number }[]
}
export async function lireCommandes(sb: SupabaseClient): Promise<CommandeEnvoyee[]> {
  const lignes = verifier(await sb.from('commandes')
    .select('reference, cree_le, sous_total_dh, nom, telephone, email, ville, adresse, instructions, lignes_commande(slug, nom, coloris, taille, quantite, prix_dh)')
    .order('cree_le', { ascending: false })) as LigneCommande[]
  return (lignes ?? []).map(c => ({
    reference: c.reference, date: c.cree_le, sousTotalDH: c.sous_total_dh,
    client: { nom: c.nom, telephone: c.telephone, email: c.email, ville: c.ville, adresse: c.adresse, instructions: c.instructions },
    lignes: c.lignes_commande.map(l => ({ cle: cleLigne(l.slug, l.coloris, l.taille), slug: l.slug, coloris: l.coloris, taille: l.taille, quantite: l.quantite, nom: l.nom, prixDH: l.prix_dh })),
  }))
}
