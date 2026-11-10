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
/** Rôle : « technique » (tout, supervision comprise) ou « commerce » (catalogue, commandes, demandes). */
export type RoleAdmin = 'technique' | 'commerce'
export interface StatutAdmin { admin: boolean; cle: boolean; deverrouille: boolean; role: RoleAdmin | null }
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

// ── Supervision technique (lot C) : lecture réservée au rôle technique par la base ─────────────────
export interface Controle { id?: number; cree_le?: string; source?: 'robot' | 'admin'; cible: string; ok: boolean; statut_http: number | null; duree_ms: number | null; detail: string }
export interface ErreurSite { id: number; cree_le: string; type: string; gravite: 'erreur' | 'avertissement'; message: string; page: string; source: string; version: string; navigateur: string }
export interface Sauvegarde { id: number; cree_le: string; type: 'manuelle' | 'restauration_testee' | 'echec'; note: string }

/** Statut honnête d'un service : « inconnu » tant qu'aucun contrôle récent n'existe, jamais vert par défaut. */
export type StatutService = 'operationnel' | 'degrade' | 'indisponible' | 'inconnu'
export interface ServiceSurveille {
  cible: string; dernier: string; source: 'robot' | 'admin'; ok: boolean; duree_ms: number | null; statut_http: number | null; detail: string; seuil_ms: number
  controles_24h: number; disponibilite_24h: number | null; controles_7j: number; disponibilite_7j: number | null
  moyenne_ms_24h: number | null; p95_ms_24h: number | null; statut: StatutService
}
export interface EtatSupervision {
  services: ServiceSurveille[]
  tendance: { heure: string; site_ms: number | null; base_ms: number | null; echecs: number; controles: number }[]
  dernier_robot: string | null
  deploiements: { version: string; construit_le: string | null; vu_le: string }[]
  sauvegardes: { derniere: string | null; derniere_restauration: string | null; dernier_echec: string | null }
  compteurs_24h: { erreurs: number; erreurs_api: number; controles_en_echec: number; appels_publics: number; appels_bloques: number; securite: number }
  appels_par_action_24h: { action: string; acceptes: number; bloques: number }[]
}
export async function etatSupervision(): Promise<EtatSupervision> {
  return verifier(await (await base()).rpc('etat_supervision')) as EtatSupervision
}
export type CategorieJournal = 'site' | 'api' | 'sante' | 'securite' | 'deploiement' | 'sauvegarde' | 'base'
export type GraviteJournal = 'info' | 'avertissement' | 'erreur' | 'critique'
export interface EntreeTechnique { quand: string; categorie: CategorieJournal; gravite: GraviteJournal; origine: string; message: string; detail: string }
export async function journalTechnique(heures: number, categorie: CategorieJournal | null, gravite: GraviteJournal | null): Promise<EntreeTechnique[]> {
  return verifier(await (await base()).rpc('journal_technique', { p_heures: heures, p_categorie: categorie, p_gravite: gravite })) as EntreeTechnique[]
}
export interface StatistiquesSupervision {
  visites: { aujourdhui: number; visiteurs_aujourdhui: number; sept_jours: number; visiteurs_sept_jours: number; trente_jours: number
    lcp_median_ms: number | null; lcp_mesures: number; pages: { page: string; vues: number }[]; par_jour: { jour: string; vues: number; visiteurs: number }[] }
  limites: { regles: { action: string; maximum: number; fenetre_minutes: number; maximum_global: number | null; description: string }[]
    bloques_24h: { action: string; bloques: number; visiteurs: number }[]; bloques_7j: number
    suspects: { visiteur: string; action: string; bloques: number; dernier: string }[]; historique: { cree_le: string; action: string; visiteur: string }[] }
  erreurs: { vingt_quatre_heures: number; sept_jours: number }
}
export async function statistiquesSupervision(): Promise<StatistiquesSupervision> {
  return verifier(await (await base()).rpc('statistiques_supervision')) as StatistiquesSupervision
}
export async function controlesRecents(): Promise<Controle[]> {
  return verifier(await (await base()).from('controles_sante').select('id, cree_le, source, cible, ok, statut_http, duree_ms, detail').order('cree_le', { ascending: false }).limit(200)) as Controle[]
}
export async function erreursRecentes(): Promise<ErreurSite[]> {
  return verifier(await (await base()).from('erreurs_site').select('id, cree_le, type, gravite, message, page, source, version, navigateur').order('cree_le', { ascending: false }).limit(100)) as ErreurSite[]
}
export async function noterControles(resultats: Controle[]) {
  verifier(await (await base()).rpc('noter_controles', { resultats }))
}
export async function listerSauvegardes(): Promise<Sauvegarde[]> {
  return verifier(await (await base()).from('sauvegardes').select('id, cree_le, type, note').order('cree_le', { ascending: false }).limit(20)) as Sauvegarde[]
}
export async function noterSauvegarde(type: Sauvegarde['type'], note: string) {
  verifier(await (await base()).from('sauvegardes').insert({ type, note: note.trim().slice(0, 300) }))
}

/** Contrôles faits maintenant, depuis ce navigateur : site (version en ligne), base, comptes, photos.
 *  WhatsApp ne se vérifie pas d'ici (le navigateur bloque l'appel) : c'est le robot qui le fait. */
export async function controlerMaintenant(): Promise<Controle[]> {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
  const chrono = async (cible: string, faire: () => Promise<{ statut: number | null; detail: string }>): Promise<Controle> => {
    const debut = performance.now()
    try {
      const { statut, detail } = await faire()
      return { cible, ok: !detail, statut_http: statut, duree_ms: Math.round(performance.now() - debut), detail }
    } catch (e) {
      return { cible, ok: false, statut_http: 0, duree_ms: Math.round(performance.now() - debut), detail: String((e as Error)?.message ?? e).slice(0, 200) }
    }
  }
  const sb = await base()
  let versionVue: { version: string; construit_le: string | null } | null = null
  const resultats: (Controle & { version?: string; construit_le?: string | null })[] = await Promise.all([
    chrono('site : version', async () => {
      const r = await fetch('/version.json', { cache: 'no-store' })
      if (!r.ok) return { statut: r.status, detail: `HTTP ${r.status}` }
      if (!(r.headers.get('content-type') ?? '').includes('json')) return { statut: r.status, detail: 'version.json absent (l\'hébergeur renvoie une page)' }
      const v = (await r.json()) as { version?: string; construit_le?: string }
      if (v.version) versionVue = { version: v.version, construit_le: v.construit_le ?? null }
      return { statut: r.status, detail: v.version ? '' : 'version.json illisible' }
    }),
    chrono('base : santé (GET)', async () => {
      const r = await fetch(`${url}/rest/v1/rpc/sante`, { headers: { apikey: cle }, cache: 'no-store' })
      if (!r.ok) return { statut: r.status, detail: `HTTP ${r.status}` }
      return { statut: r.status, detail: ((await r.json()) as { ok?: boolean })?.ok === true ? '' : 'réponse inattendue' }
    }),
    chrono('base : API et données', async () => {
      const { error, status } = await sb.from('reglages').select('cle', { head: true, count: 'exact' })
      return { statut: status, detail: error ? error.message : '' }
    }),
    chrono('base : comptes (Auth)', async () => {
      const r = await fetch(`${url}/auth/v1/health`, { headers: { apikey: cle } })
      return { statut: r.status, detail: r.ok ? '' : `HTTP ${r.status}` }
    }),
  ])
  const { data } = await sb.from('produits').select('images').eq('publie', true).limit(20)
  const photo = ((data ?? []) as { images: { src?: string }[] }[]).flatMap(l => l.images ?? []).map(i => i.src ?? '').find(s => /^https?:\/\//.test(s))
  resultats.push(photo
    ? await chrono('stockage : photos', async () => { const r = await fetch(photo, { method: 'HEAD', cache: 'no-store' }); return { statut: r.status, detail: r.ok ? '' : `HTTP ${r.status}` } })
    : { cible: 'stockage : photos', ok: true, statut_http: null, duree_ms: null, detail: 'aucune photo téléversée dans le catalogue : non vérifié' })
  // Seul un site construit (pas le serveur de dev) a une vraie version à noter comme déploiement.
  if (versionVue && !import.meta.env.DEV) Object.assign(resultats[0], versionVue)
  await noterControles(resultats).catch(() => undefined)
  return resultats
}

/** Version publiée en ligne (/version.json), pour la comparer à celle de ce navigateur. */
export async function versionEnLigne(): Promise<{ version: string; construit_le: string } | null> {
  try {
    const r = await fetch('/version.json', { cache: 'no-store' })
    return r.ok ? await r.json() as { version: string; construit_le: string } : null
  } catch { return null }
}

// ── Demandes WhatsApp (lot D) : contacts commerciaux notés au clic, à traiter ; jamais des commandes ──────
export type StatutDemande = 'a_traiter' | 'traitee' | 'sans_suite'
export interface DemandeWhatsApp {
  id: number; cree_le: string; motif: 'renseignement' | 'commande' | 'alerte_stock' | 'conseil_taille'
  slug: string; nom_produit: string; coloris: string; taille: string; prix_dh: number | null; statut: StatutDemande; note: string; traitee_le: string | null
}
export async function listerDemandes(): Promise<DemandeWhatsApp[]> {
  return verifier(await (await base()).from('demandes_whatsapp')
    .select('id, cree_le, motif, slug, nom_produit, coloris, taille, prix_dh, statut, note, traitee_le').order('cree_le', { ascending: false }).limit(300)) as DemandeWhatsApp[]
}
export async function suivreDemande(id: number, statut: StatutDemande, note: string) {
  verifier(await (await base()).from('demandes_whatsapp')
    .update({ statut, note: note.trim().slice(0, 500), traitee_le: statut === 'a_traiter' ? null : new Date().toISOString() }).eq('id', id))
}
/** Builds relancés par le robot après un changement du catalogue (aperçus de partage à jour). */
export async function dernieresRepublications(): Promise<{ cree_le: string; raison: string }[]> {
  return verifier(await (await base()).from('republications').select('cree_le, raison').order('cree_le', { ascending: false }).limit(5)) as { cree_le: string; raison: string }[]
}
