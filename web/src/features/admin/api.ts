import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenirSupabase } from '@/lib/supabase'
import { ligneVersProduit, produitVersLigne, type LigneProduit, type ProduitAdmin, type Textes } from '@/lib/produitsBase'
import type { CommandeAdmin, EntreeJournal, Statut } from '@/lib/admin'
import type { ReglagesBoutique, Produit } from '@/lib/types'

/** Accès à la base pour l'administration. Les droits sont vérifiés par la base (RLS + `est_admin()`, lot-20-admin.sql) :
 *  ces fonctions n'accordent rien elles-mêmes. Toute erreur est levée avec un message en français. */
const MESSAGES: Record<string, string> = {
  '42501': 'Action réservée à l\'administration.',
  '23505': 'Cette adresse de pièce existe déjà.',
  '23514': 'Une valeur ne respecte pas les règles (prix, ancien prix, adresse…).',
  P0002: 'Élément introuvable : il a peut-être été supprimé entre-temps.',
}
/** Erreur de la base, avec son code d'origine (utile pour distinguer une session refusée d'une panne). */
export class ErreurBase extends Error {
  constructor(message: string, readonly code?: string, readonly detail?: string) { super(message) }
}
function verifier<T>({ data, error }: { data: T; error: { message: string; code?: string } | null }): T {
  if (error) throw new ErreurBase(MESSAGES[error.code ?? ''] ?? error.message, error.code, error.message)
  return data
}
/** Session refusée par la base (jeton expiré, invalide, ou d'un autre projet Supabase) : il faut se reconnecter. */
export const sessionRefusee = (e: unknown) =>
  e instanceof ErreurBase && (/^PGRST30/.test(e.code ?? '') || /jwt|token|session/i.test(`${e.detail ?? ''} ${e.message}`))
async function base(): Promise<SupabaseClient> {
  const sb = await obtenirSupabase()
  if (!sb) throw new Error('Base de données non configurée (web/.env).')
  return sb
}

/** Compte inscrit dans `admins` ? clé posée en base ? session déjà déverrouillée par la clé ? (lot-21-admin-cle.sql) */
export interface StatutAdmin { admin: boolean; cle: boolean; deverrouille: boolean }
export async function statutAdmin(): Promise<StatutAdmin> {
  return verifier(await (await base()).rpc('admin_statut')) as StatutAdmin
}
/** Clé de sécurité vérifiée par la base (empreinte bcrypt, 5 essais puis 15 min de blocage). */
export async function deverrouillerAdmin(cle: string): Promise<{ ok: boolean; message?: string }> {
  return verifier(await (await base()).rpc('deverrouiller_admin', { cle })) as { ok: boolean; message?: string }
}
/** Retire les droits de la session avant la déconnexion. */
export async function verrouillerAdmin() {
  verifier(await (await base()).rpc('verrouiller_admin'))
}

// ── Produits ────────────────────────────────────────────────────────────────────────────────────
export async function listerProduits(): Promise<ProduitAdmin[]> {
  const lignes = verifier(await (await base()).from('produits').select('*').order('ordre').order('nom')) as LigneProduit[]
  return lignes.map(ligneVersProduit)
}
export async function lireProduit(slug: string): Promise<ProduitAdmin | null> {
  const l = verifier(await (await base()).from('produits').select('*').eq('slug', slug).maybeSingle()) as LigneProduit | null
  return l ? ligneVersProduit(l) : null
}
export async function creerProduit(p: ProduitAdmin) {
  verifier(await (await base()).from('produits').insert(produitVersLigne(p, p)))
}
export async function modifierProduit(p: ProduitAdmin) {
  const { slug, ...reste } = produitVersLigne(p, p)
  verifier(await (await base()).from('produits').update({ ...reste, maj_le: new Date().toISOString() }).eq('slug', slug))
}
export async function changerPublication(slug: string, publie: boolean) {
  verifier(await (await base()).from('produits').update({ publie, maj_le: new Date().toISOString() }).eq('slug', slug))
}
export async function supprimerProduit(slug: string) {
  verifier(await (await base()).from('produits').delete().eq('slug', slug))
}
/** Import initial : les pièces de `produits.json` absentes de la base y sont ajoutées, dans le même ordre. */
/** Import automatique à la première entrée dans l'admin : seulement si la base n'a aucune pièce ET que l'admin n'a
 *  jamais touché aux produits (journal vide côté produits). Une base vidée exprès par l'admin n'est donc jamais re-remplie. */
export async function importInitialNecessaire(): Promise<boolean> {
  const sb = await base()
  const { count, error } = await sb.from('produits').select('slug', { count: 'exact', head: true })
  if (error) throw new ErreurBase(MESSAGES[error.code ?? ''] ?? error.message, error.code, error.message)
  if (count) return false
  const deja = verifier(await sb.from('journal_admin').select('id').like('action', 'produit%').limit(1)) as unknown[]
  return deja.length === 0
}
export async function importerCatalogue(liste: Produit[]) {
  const lignes = liste.map((p, i) => produitVersLigne(p, { publie: true, ordre: i }))
  verifier(await (await base()).from('produits').upsert(lignes, { onConflict: 'slug', ignoreDuplicates: true }))
  return lignes.length
}

// ── Photos (espace de stockage « produits », public en lecture) ──────────────────────────────────
const ESPACE = 'produits'
/** Envoie les deux tailles WebP ; renvoie le chemin public sans suffixe, comme dans produits.json. */
export async function televerserPhoto(slug: string, fichiers: { 480: Blob; 960: Blob }) {
  const sb = await base()
  const nom = `${slug}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  for (const l of [480, 960] as const) {
    verifier(await sb.storage.from(ESPACE).upload(`${nom}-${l}.webp`, fichiers[l], { contentType: 'image/webp', upsert: false }))
  }
  return sb.storage.from(ESPACE).getPublicUrl(nom).data.publicUrl
}
/** Retire les fichiers d'une photo envoyée par l'administration (les photos livrées avec le site restent). */
export async function supprimerPhoto(src: string) {
  const marque = `/object/public/${ESPACE}/`
  const i = src.indexOf(marque)
  if (i < 0) return
  const chemin = decodeURIComponent(src.slice(i + marque.length))
  verifier(await (await base()).storage.from(ESPACE).remove([`${chemin}-480.webp`, `${chemin}-960.webp`]))
}

// ── Réglages et textes ──────────────────────────────────────────────────────────────────────────
export async function lireReglages(): Promise<{ boutique: ReglagesBoutique | null; textes: Partial<Textes> | null }> {
  const lignes = verifier(await (await base()).from('reglages').select('cle, valeur')) as { cle: string; valeur: unknown }[]
  const m = Object.fromEntries(lignes.map(l => [l.cle, l.valeur]))
  return { boutique: (m.boutique ?? null) as ReglagesBoutique | null, textes: (m.textes ?? null) as Partial<Textes> | null }
}
export async function enregistrerReglage(cle: 'boutique' | 'textes', valeur: object) {
  verifier(await (await base()).from('reglages').upsert({ cle, valeur, maj_le: new Date().toISOString() }))
}

// ── Commandes ───────────────────────────────────────────────────────────────────────────────────
export async function listerCommandes(): Promise<CommandeAdmin[]> {
  return verifier(await (await base()).from('commandes')
    .select('reference, cree_le, statut, sous_total_dh, nom, telephone, email, ville, adresse, instructions, lignes_commande(slug, nom, coloris, taille, quantite, prix_dh)')
    .order('cree_le', { ascending: false })) as CommandeAdmin[]
}
export async function changerStatut(reference: string, statut: Statut) {
  verifier(await (await base()).rpc('changer_statut_commande', { ref: reference, nouveau_statut: statut }))
}
export async function supprimerCommande(reference: string) {
  verifier(await (await base()).rpc('supprimer_commande', { ref: reference }))
}

// ── Journal ─────────────────────────────────────────────────────────────────────────────────────
export const PAGE_JOURNAL = 50
export async function lireJournal(avant?: number): Promise<EntreeJournal[]> {
  let q = (await base()).from('journal_admin').select('id, cree_le, auteur_email, action, cible, details').order('id', { ascending: false }).limit(PAGE_JOURNAL)
  if (avant) q = q.lt('id', avant)
  return verifier(await q) as EntreeJournal[]
}
