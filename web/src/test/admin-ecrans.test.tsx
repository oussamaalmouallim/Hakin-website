import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', genre: 'homme', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: [], prixDH: null, prixBarreDH: null,
    coloris: [{ nom: 'noir', hex: '#000000' }], tailles: [], disponibilite: 'a_confirmer', description: 'Coton', matiere: null, entretien: null,
    images: [{ src: '/x', alt: 'T-shirt Été, face', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: ['prix', 'tailles'] },
  { slug: 'b', nom: 'Polo Riviera', marque: 'Casablanca', categorie: 't-shirts', collections: [], prixDH: null, prixBarreDH: null,
    coloris: [], tailles: [], disponibilite: 'a_confirmer', description: '', matiere: null, entretien: null,
    images: [{ src: '/y', alt: 'Polo, face', vue: 'face' }], nouveau: false, misEnAvant: false, aConfirmer: ['prix'] },
] }))

/** Fausse base en mémoire : assez de l'API Supabase pour les écrans d'administration. Les droits réels (RLS, `est_admin()`)
 *  sont vérifiés sur le Supabase local (`npm run test:supabase`) ; ici on vérifie l'interface et ce qu'elle envoie. */
type Ligne = Record<string, unknown>
const base: Record<string, Ligne[]> = {}
const appels: { rpc: [string, unknown][]; ecritures: [string, string, unknown][] } = { rpc: [], ecritures: [] }
let admin = true
let deverrouille = true
let cleDefinie = true
let role: 'technique' | 'commerce' = 'technique'
let erreurStatut: { code: string; message: string } | null = null
const CLE = '482915603718'
const COMPTES: Record<string, { id: string; mdp: string }> = { 'admin@hmode.test': { id: 'u-admin', mdp: 'Admin-2026' }, 'client@hmode.test': { id: 'u-client', mdp: 'Client-2026' } }
const CLES: Record<string, string> = { produits: 'slug', reglages: 'cle', commandes: 'reference' }

class Requete {
  private mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private valeur: unknown = null
  private filtres: ((l: Ligne) => boolean)[] = []
  private unique = false
  private compte = false
  constructor(private table: string) {}
  select(_c?: string, o?: { count?: string; head?: boolean }) { this.compte = Boolean(o?.head); return this }
  like(c: string, motif: string) { this.filtres.push(l => String(l[c] ?? '').startsWith(motif.replace(/%$/, ''))); return this }
  order() { return this }
  limit() { return this }
  maybeSingle() { this.unique = true; return this }
  eq(c: string, v: unknown) { this.filtres.push(l => l[c] === v); return this }
  lt(c: string, v: number) { this.filtres.push(l => (l[c] as number) < v); return this }
  in(c: string, vs: unknown[]) { this.filtres.push(l => vs.includes(l[c])); return this }
  insert(v: unknown) { this.mode = 'insert'; this.valeur = v; return this }
  update(v: unknown) { this.mode = 'update'; this.valeur = v; return this }
  upsert(v: unknown) { this.mode = 'upsert'; this.valeur = v; return this }
  delete() { this.mode = 'delete'; return this }
  then<A, B>(ok?: ((v: { data: unknown; count?: number; error: { message: string; code?: string } | null }) => A) | null, ko?: ((e: unknown) => B) | null) {
    return Promise.resolve(this.executer()).then(ok, ko)
  }
  private executer() {
    const t = (base[this.table] ??= [])
    const visibles = t.filter(l => this.filtres.every(f => f(l)))
    if (this.mode === 'select' && this.compte) return { data: null, count: visibles.length, error: null }
    if (this.mode === 'select') return { data: this.unique ? visibles[0] ?? null : visibles.map(l => ({ ...l })), error: null }
    appels.ecritures.push([this.table, this.mode, this.valeur])
    if (!admin || !deverrouille) return { data: null, error: { message: 'rls', code: '42501' } }
    const cle = CLES[this.table]
    if (this.mode === 'update') { visibles.forEach(l => Object.assign(l, this.valeur)); return { data: null, error: null } }
    if (this.mode === 'delete') { base[this.table] = t.filter(l => !visibles.includes(l)); return { data: null, error: null } }
    for (const v of [this.valeur].flat() as Ligne[]) {
      const existe = t.find(l => l[cle] === v[cle])
      if (existe && this.mode === 'insert') return { data: null, error: { message: 'duplicate', code: '23505' } }
      if (existe) Object.assign(existe, v); else t.push({ ...v })
    }
    return { data: null, error: null }
  }
}
const faux = {
  from: (t: string) => new Requete(t),
  rpc: async (nom: string, args: unknown) => {
    appels.rpc.push([nom, args])
    const uid = useSession.getState().utilisateur?.id
    const estCompteAdmin = admin && uid === 'u-admin'
    if (nom === 'admin_statut' && erreurStatut) return { data: null, error: erreurStatut }
    if (nom === 'admin_statut') return { data: { admin: estCompteAdmin, cle: cleDefinie, deverrouille: estCompteAdmin && deverrouille, role: estCompteAdmin ? role : null }, error: null }
    if (nom === 'deverrouiller_admin') {
      if (!estCompteAdmin) return { data: null, error: { message: 'Réservé à l\'administration.', code: '42501' } }
      if ((args as { cle: string }).cle !== CLE) return { data: { ok: false, message: 'Clé incorrecte (4 essais restants).' }, error: null }
      deverrouille = true
      return { data: { ok: true }, error: null }
    }
    if (nom === 'verrouiller_admin') { deverrouille = false; return { data: null, error: null } }
    const { ref, nouveau_statut } = args as { ref: string; nouveau_statut?: string }
    const c = base.commandes?.find(x => x.reference === ref)
    if (!c) return { data: null, error: { message: 'introuvable', code: 'P0002' } }
    if (nom === 'changer_statut_commande') c.statut = nouveau_statut
    if (nom === 'supprimer_commande') base.commandes = base.commandes.filter(x => x !== c)
    return { data: null, error: null }
  },
  storage: { from: () => ({ upload: async () => ({ data: {}, error: null }), remove: async () => ({ data: [], error: null }), getPublicUrl: (p: string) => ({ data: { publicUrl: `https://stockage.test/${p}` } }) }) },
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), getSession: async () => ({ data: { session: null } }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const c = COMPTES[email]
      if (!c || c.mdp !== password) return { data: { user: null }, error: { name: 'AuthApiError', message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 } }
      return { data: { user: { id: c.id, email, user_metadata: { nom: '' } } }, error: null }
    },
    signOut: async () => ({ error: null }),
  },
}
vi.mock('@/lib/supabase', () => ({ supabaseActif: true, memoriserSession: () => {}, obtenirSupabase: async () => faux }))

const { default: App } = await import('@/App')
const { FournisseurAnimations } = await import('@/state/animations')
const { FournisseurNotifications } = await import('@/design-system')
const { useSession } = await import('@/state/session')
const { produitsFichier } = await import('@/lib/catalogue')
const { produitVersLigne } = await import('@/lib/produitsBase')

window.scrollTo = vi.fn() as never
class IO { observe() {} unobserve() {} disconnect() {} }
;(window as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO
window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) as never

const monter = (url: string) => render(
  <MemoryRouter initialEntries={[url]}><FournisseurAnimations><FournisseurNotifications><App /></FournisseurNotifications></FournisseurAnimations></MemoryRouter>)
const connecter = () => useSession.setState({ utilisateur: { id: 'u-admin', email: 'admin@hmode.test', nom: 'Admin' }, pret: true })
const remplirCatalogue = () => { base.produits = produitsFichier().map((p, i) => produitVersLigne(p, { publie: true, ordre: i }) as unknown as Ligne) }
const commande = (reference: string, statut = 'nouvelle'): Ligne => ({
  reference, cree_le: '2026-11-07T10:00:00Z', statut, sous_total_dh: 900, nom: 'Sara Alaoui', telephone: '0612345678', email: '', ville: 'Rabat',
  adresse: '4 avenue Mohammed V', instructions: '', lignes_commande: [{ slug: 'a', nom: 'T-shirt Été', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 450 }],
})

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k]
  appels.rpc.length = 0; appels.ecritures.length = 0
  admin = true; deverrouille = true; cleDefinie = true; erreurStatut = null; role = 'technique'
  sessionStorage.setItem('hmode-sans-intro', '1')
})
afterEach(() => useSession.setState({ utilisateur: null, pret: false }))

describe('administration : accès', () => {
  it('sans compte connecté : connexion propre à l\'admin, sans inscription ni lien vers l\'espace client', async () => {
    useSession.setState({ utilisateur: null, pret: true })
    monter('/admin/produits')
    const f = await screen.findByRole('form', { name: 'Connexion administrateur' })
    expect(within(f).queryByText(/Créer un compte/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /compte/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Connexion' })).not.toBeInTheDocument()
  })

  const remplir = async (u: ReturnType<typeof userEvent.setup>, f: HTMLElement, email: string, mdp: string, cle: string) => {
    for (const [label, v] of [['Adresse e-mail', email], ['Mot de passe', mdp], ['Clé de sécurité', cle]] as const) {
      const c = within(f).getByLabelText(label); await u.clear(c); if (v) await u.type(c, v)
    }
    await u.click(within(f).getByRole('button', { name: 'Se connecter' }))
  }

  it('trois champs obligatoires ; mot de passe faux, puis compte client : refusés, session refermée', async () => {
    useSession.setState({ utilisateur: null, pret: true })
    const u = userEvent.setup()
    monter('/admin')
    const f = await screen.findByRole('form', { name: 'Connexion administrateur' })
    await u.click(within(f).getByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Adresse e-mail invalide.')).toBeInTheDocument()
    expect(screen.getByText('Saisissez le mot de passe.')).toBeInTheDocument()
    expect(screen.getByText('Saisissez la clé de sécurité.')).toBeInTheDocument()
    const champCle = within(f).getByLabelText('Clé de sécurité')
    await u.type(champCle, 'Ma clé-2026 !')
    expect(champCle).toHaveValue('Ma clé-2026 !') // format libre : lettres, chiffres, espaces, symboles
    await remplir(u, f, 'client@hmode.test', 'faux', CLE)
    expect(await within(f).findByRole('alert')).toHaveTextContent(/incorrect|invalide/i)
    await remplir(u, f, 'client@hmode.test', 'Client-2026', CLE)
    expect(await screen.findByText('Ce compte n\'a pas accès à l\'administration.')).toBeInTheDocument()
    expect(useSession.getState().utilisateur).toBeNull()
    expect(appels.rpc.map(r => r[0])).not.toContain('deverrouiller_admin')
  })

  it('admin : e-mail + mot de passe + clé fausse refusés (session refermée), puis clé juste ; déconnexion qui verrouille', async () => {
    useSession.setState({ utilisateur: null, pret: true }); deverrouille = false; remplirCatalogue()
    const u = userEvent.setup()
    monter('/admin')
    const f = await screen.findByRole('form', { name: 'Connexion administrateur' })
    await remplir(u, f, 'admin@hmode.test', 'Admin-2026', '111122223333')
    expect(await screen.findByText('Clé incorrecte (4 essais restants).')).toBeInTheDocument()
    expect(useSession.getState().utilisateur).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Administration' })).not.toBeInTheDocument()
    const f2 = screen.getByRole('form', { name: 'Connexion administrateur' })
    expect(within(f2).getByLabelText('Clé de sécurité')).toHaveValue('')
    await remplir(u, f2, 'admin@hmode.test', 'Admin-2026', CLE)
    expect(await screen.findByRole('navigation', { name: 'Administration' })).toBeInTheDocument()
    expect(appels.rpc).toContainEqual(['deverrouiller_admin', { cle: CLE }])
    await u.click(screen.getAllByRole('button', { name: /Se déconnecter|Déconnexion/ })[0])
    await waitFor(() => expect(useSession.getState().utilisateur).toBeNull())
    expect(appels.rpc.map(r => r[0])).toContain('verrouiller_admin')
    expect(deverrouille).toBe(false)
  })

  it('session admin expirée (non déverrouillée) : retour au formulaire, e-mail déjà rempli', async () => {
    deverrouille = false; connecter()
    monter('/admin')
    const f = await screen.findByRole('form', { name: 'Connexion administrateur' })
    expect(within(f).getByLabelText('Adresse e-mail')).toHaveValue('admin@hmode.test')
    expect(screen.getByText(/session d'administration a expiré/)).toBeInTheDocument()
  })

  it('session gardée par le navigateur mais refusée par la base (jeton expiré) : refermée, retour au formulaire avec un avis', async () => {
    erreurStatut = { code: 'PGRST303', message: 'JWT expired' }; connecter()
    monter('/admin')
    expect(await screen.findByRole('form', { name: 'Connexion administrateur' })).toBeInTheDocument()
    expect(screen.getByText('Votre session n\'était plus valable. Reconnectez-vous.')).toBeInTheDocument()
    await waitFor(() => expect(useSession.getState().utilisateur).toBeNull())
    expect(screen.queryByText('Vérification impossible')).not.toBeInTheDocument()
  })

  it('autre erreur de la base : « Vérification impossible » avec le détail, Réessayer et Se déconnecter', async () => {
    erreurStatut = { code: '42883', message: 'function public.admin_statut() does not exist' }; connecter()
    const u = userEvent.setup()
    monter('/admin')
    expect(await screen.findByRole('heading', { name: 'Vérification impossible' })).toBeInTheDocument()
    expect(screen.getByText(/Détail : 42883 — function public.admin_statut\(\) does not exist/)).toBeInTheDocument()
    erreurStatut = null
    await u.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('navigation', { name: 'Administration' })).toBeInTheDocument()
  })

  it('compte client déjà connecté sur le site : « Accès réservé », puis « Changer de compte »', async () => {
    useSession.setState({ utilisateur: { id: 'u-client', email: 'client@hmode.test', nom: '' }, pret: true })
    const u = userEvent.setup()
    monter('/admin')
    expect(await screen.findByRole('heading', { name: 'Accès réservé' })).toBeInTheDocument()
    expect(screen.getByText('client@hmode.test')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Administration' })).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Changer de compte' }))
    expect(await screen.findByRole('form', { name: 'Connexion administrateur' })).toBeInTheDocument()
  })

  it('aucune clé posée en base : l\'admin est arrêté avec la marche à suivre', async () => {
    cleDefinie = false; deverrouille = false; connecter()
    monter('/admin')
    expect(await screen.findByRole('heading', { name: 'Clé non définie' })).toBeInTheDocument()
    expect(screen.getByText('npm run admin:sql')).toBeInTheDocument()
  })

  it('admin : menu complet, chaque onglet ouvre son écran', async () => {
    connecter(); remplirCatalogue()
    const u = userEvent.setup()
    monter('/admin')
    const menu = await screen.findByRole('navigation', { name: 'Administration' })
    for (const [onglet, titre] of [['Produits et prix', 'Produits et prix'], ['Commandes', 'Commandes'], ['Réglages', 'Réglages'], ['Textes', 'Textes'], ['Journal', 'Journal'], ['Tableau de bord', 'Tableau de bord']]) {
      await u.click(within(menu).getByRole('link', { name: onglet }))
      expect(await screen.findByRole('heading', { level: 1, name: titre })).toBeInTheDocument()
    }
  })
})

describe('administration : catalogue', () => {
  it('première entrée dans l\'admin, base vide : catalogue actuel importé tout seul, rien d\'inventé', async () => {
    connecter()
    monter('/admin')
    expect(await screen.findByText('Catalogue actuel importé automatiquement : 2 pièces.')).toBeInTheDocument()
    expect(base.produits.map(p => [p.slug, p.prix_dh, p.publie, p.ordre])).toEqual([['a', null, true, 0], ['b', null, true, 1]])
    expect(await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Importer les/ })).not.toBeInTheDocument()
    expect(appels.ecritures.filter(e => e[0] === 'produits')).toHaveLength(1) // un seul import, même en mode strict
  })

  it('base vidée exprès par l\'admin (journal) : pas de réimport automatique ; import possible à la main', async () => {
    base.journal_admin = [{ id: 1, action: 'produit supprimé', cible: 'a', auteur_email: 'admin@hmode.test', cree_le: '2026-11-07T10:00:00Z', details: {} }]
    connecter()
    const u = userEvent.setup()
    monter('/admin/produits')
    await u.click(await screen.findByRole('button', { name: 'Importer les 2 pièces' }))
    expect(await screen.findByText('T-shirt Été')).toBeInTheDocument()
    expect(screen.getByText('Polo Riviera')).toBeInTheDocument()
    expect(screen.queryByText(/importé automatiquement/)).not.toBeInTheDocument()
  })

  it('fiche : ancien prix refusé s\'il est plus bas, puis prix, solde et tailles enregistrés', async () => {
    connecter(); remplirCatalogue()
    const u = userEvent.setup()
    monter('/admin/produits/a')
    const prix = await screen.findByLabelText('Prix de vente (DH)')
    await u.type(prix, '5a20')
    expect(prix).toHaveValue('520')
    await u.type(screen.getByLabelText(/Ancien prix/), '400')
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('L\'ancien prix doit être plus élevé que le prix de vente.')).toBeInTheDocument()
    expect(appels.ecritures.filter(([t]) => t === 'produits')).toHaveLength(0)

    await u.clear(screen.getByLabelText(/Ancien prix/)); await u.type(screen.getByLabelText(/Ancien prix/), '650')
    expect(screen.getByText(/En solde : -20 %/)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'XS à XXL' }))
    await u.click(screen.getByRole('switch', { name: 'Taille XXL disponible' }))
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Modifications enregistrées.')).toBeInTheDocument()
    const ligne = base.produits.find(p => p.slug === 'a')!
    expect(ligne).toMatchObject({ prix_dh: 520, prix_barre_dh: 650, a_confirmer: [] })
    expect((ligne.tailles as { taille: string; disponible: boolean }[]).map(t => `${t.taille}:${t.disponible}`)).toEqual(['XS:true', 'S:true', 'M:true', 'L:true', 'XL:true', 'XXL:false'])
    expect(screen.getByText('À jour')).toBeInTheDocument()
  })

  it('nouvelle pièce : adresse tirée du nom, déjà prise refusée, puis créée masquée', async () => {
    connecter(); remplirCatalogue()
    const u = userEvent.setup()
    monter('/admin/produits/nouveau')
    await u.type(await screen.findByLabelText('Nom'), 'Polo Riviera')
    expect(screen.getByLabelText('Adresse de la page')).toHaveValue('polo-riviera')
    await u.clear(screen.getByLabelText('Adresse de la page')); await u.type(screen.getByLabelText('Adresse de la page'), 'b')
    await u.click(screen.getByRole('button', { name: 'Créer la pièce' }))
    expect(await screen.findByText('Cette adresse est déjà prise par une autre pièce.')).toBeInTheDocument()
    await u.clear(screen.getByLabelText('Adresse de la page')); await u.type(screen.getByLabelText('Adresse de la page'), 'polo-riviera-2')
    await u.click(screen.getByRole('button', { name: 'Créer la pièce' }))
    expect(await screen.findByText('Pièce créée.')).toBeInTheDocument()
    expect(base.produits.find(p => p.slug === 'polo-riviera-2')).toMatchObject({ nom: 'Polo Riviera', publie: false, prix_dh: null })
  })

  it('liste : filtre « Sans prix », visibilité basculée, suppression confirmée', async () => {
    connecter(); remplirCatalogue()
    base.produits[0].prix_dh = 450
    const u = userEvent.setup()
    monter('/admin/produits')
    await u.click(await screen.findByRole('button', { name: 'Sans prix' }))
    expect(screen.getByText('1 pièce')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Tous' }))
    const bascule = screen.getAllByRole('switch', { name: 'Visible sur le site : Polo Riviera' })[0]
    await u.click(bascule)
    await waitFor(() => expect(base.produits.find(p => p.slug === 'b')!.publie).toBe(false))
    expect(await screen.findByText('Pièce masquée du site.')).toBeInTheDocument()

    await u.click(screen.getByRole('link', { name: 'Modifier Polo Riviera' }))
    await u.click(await screen.findByRole('button', { name: 'Supprimer la pièce' }))
    const fenetre = await screen.findByRole('dialog', { name: 'Supprimer cette pièce ?' })
    await u.click(within(fenetre).getByRole('button', { name: 'Supprimer définitivement' }))
    expect(await screen.findByText('Pièce supprimée.')).toBeInTheDocument()
    expect(base.produits.map(p => p.slug)).toEqual(['a'])
  })

  it('droits refusés par la base : message clair, rien de perdu', async () => {
    connecter(); remplirCatalogue()
    const u = userEvent.setup()
    monter('/admin/produits/a')
    await u.type(await screen.findByLabelText('Prix de vente (DH)'), '300')
    admin = false
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Action réservée à l\'administration.')).toBeInTheDocument()
    expect(screen.getByLabelText('Prix de vente (DH)')).toHaveValue('300')
    expect(screen.getByText('Modifications non enregistrées')).toBeInTheDocument()
  })
})

describe('administration : commandes, réglages, textes, journal', () => {
  it('commandes : filtre, détail, statut enregistré, suppression confirmée, export', async () => {
    connecter()
    base.commandes = [commande('HM-A'), commande('HM-B', 'livree')]
    const u = userEvent.setup()
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn()
    monter('/admin/commandes')
    await u.click(await screen.findByRole('button', { name: 'Livrée' }))
    expect(screen.queryByText('HM-A')).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Toutes' }))
    await u.click(screen.getByRole('button', { name: 'Exporter (2)' }))
    expect(URL.createObjectURL).toHaveBeenCalledOnce()

    await u.click(screen.getByText('HM-A'))
    const fenetre = await screen.findByRole('dialog', { name: 'Commande HM-A' })
    expect(within(fenetre).getByRole('link', { name: /Écrire au client/ })).toHaveAttribute('href', expect.stringContaining('wa.me/212612345678'))
    await u.selectOptions(within(fenetre).getByLabelText('Statut'), 'expediee')
    await u.click(within(fenetre).getByRole('button', { name: 'Enregistrer le statut' }))
    expect(await screen.findByText('Statut : Expédiée.')).toBeInTheDocument()
    expect(appels.rpc).toContainEqual(['changer_statut_commande', { ref: 'HM-A', nouveau_statut: 'expediee' }])

    await u.click(within(fenetre).getByRole('button', { name: /Supprimer la commande/ }))
    await u.click(within(await screen.findByRole('dialog', { name: 'Supprimer cette commande ?' })).getByRole('button', { name: 'Supprimer définitivement' }))
    expect(await screen.findByText('Commande supprimée.')).toBeInTheDocument()
    expect(base.commandes.map(c => c.reference)).toEqual(['HM-B'])
  })

  it('réglages : numéro invalide refusé, puis enregistrés sans toucher au paiement', async () => {
    connecter()
    const u = userEvent.setup()
    monter('/admin/reglages')
    const wa = await screen.findByLabelText(/Numéro WhatsApp/)
    await u.clear(wa); await u.type(wa, '0612')
    await u.click(screen.getByRole('button', { name: 'Enregistrer les réglages' }))
    expect(await screen.findByText(/Numéro international, chiffres seulement/)).toBeInTheDocument()
    await u.clear(wa); await u.type(wa, '212612345678')
    await u.type(screen.getByLabelText(/Frais de livraison/), '30')
    // Villes livrées : Casablanca seule (boutique.json) ; aucune ville cochée = refusé ; Rabat ajoutée.
    const casa = screen.getByRole('checkbox', { name: 'Casablanca' })
    expect(casa).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Rabat' })).not.toBeChecked()
    await u.click(casa)
    await u.click(screen.getByRole('button', { name: 'Enregistrer les réglages' }))
    expect(await screen.findByText('Cochez au moins une ville.')).toBeInTheDocument()
    await u.click(casa)
    await u.click(screen.getByRole('checkbox', { name: 'Rabat' }))
    await u.click(screen.getByRole('button', { name: 'Enregistrer les réglages' }))
    expect(await screen.findByText('Réglages enregistrés : le site est à jour.')).toBeInTheDocument()
    const r = base.reglages.find(x => x.cle === 'boutique')!.valeur as Record<string, unknown>
    expect(r).toMatchObject({ whatsapp: '212612345678', livraison: { fraisDH: 30, villes: ['Casablanca', 'Rabat'] }, retours: 'Retour possible sous 24 h après la livraison.' })
    expect(r).not.toHaveProperty('paiement')
  })

  it('textes : sections vides retirées, texte enregistré', async () => {
    connecter()
    const u = userEvent.setup()
    monter('/admin/textes')
    await u.type(await screen.findByLabelText(/^Hébergeur/), '  Netlify  ')
    await u.click(screen.getByRole('button', { name: 'Enregistrer les textes' }))
    expect(await screen.findByText('Textes enregistrés : les pages du site sont à jour.')).toBeInTheDocument()
    expect(base.reglages.find(x => x.cle === 'textes')!.valeur).toEqual({ 'mentions-legales': { Hébergeur: 'Netlify' }, cgv: {}, confidentialiteResponsable: '', guideDesTailles: '' })
  })

  it('journal : entrées lisibles, liens vers la cible, filtre par type', async () => {
    connecter()
    base.journal_admin = [
      { id: 2, cree_le: '2026-11-07T10:00:00Z', auteur_email: 'admin@hmode.test', action: 'produit modifié', cible: 'a', details: { prix_dh: { avant: null, apres: 520 } } },
      { id: 1, cree_le: '2026-11-07T09:00:00Z', auteur_email: 'admin@hmode.test', action: 'statut de commande', cible: 'HM-A', details: { avant: 'nouvelle', apres: 'livree' } },
    ]
    const u = userEvent.setup()
    monter('/admin/journal')
    expect(await screen.findByText('prix : vide → 520')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'a' })).toHaveAttribute('href', '/admin/produits/a')
    await u.click(screen.getByRole('button', { name: 'Commandes' }))
    expect(screen.queryByText('prix : vide → 520')).not.toBeInTheDocument()
    expect(screen.getByText('Nouvelle → Livrée')).toBeInTheDocument()
  })
})

describe('administration : espaces séparés selon le rôle', () => {
  it('rôle technique : la supervision est proposée ; rôle commerce : ni lien, ni écran', async () => {
    remplirCatalogue(); connecter()
    const { unmount } = monter('/admin')
    expect(await screen.findByRole('link', { name: /Supervision/ })).toBeInTheDocument()
    unmount()
    role = 'commerce'
    monter('/admin/supervision')
    expect(await screen.findByRole('link', { name: /Commandes/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Supervision/ })).not.toBeInTheDocument()
    expect(appels.rpc.map(r => r[0])).not.toContain('statistiques_supervision')
  })
})

describe('administration : demandes WhatsApp, distinctes des commandes', () => {
  it('liste les demandes à traiter et enregistre le suivi', async () => {
    remplirCatalogue(); connecter()
    base.demandes_whatsapp = [
      { id: 1, cree_le: '2026-11-08T10:00:00Z', motif: 'renseignement', slug: 'a', nom_produit: 'T-shirt Été', coloris: 'noir', taille: 'M', prix_dh: null, statut: 'a_traiter', note: '', traitee_le: null },
      { id: 2, cree_le: '2026-11-08T09:00:00Z', motif: 'commande', slug: 'a', nom_produit: 'T-shirt Été', coloris: 'noir', taille: 'L', prix_dh: 500, statut: 'traitee', note: 'vendu', traitee_le: '2026-11-08T09:30:00Z' },
    ] as unknown as Ligne[]
    const u = userEvent.setup()
    monter('/admin/demandes')
    expect(await screen.findByRole('heading', { name: 'Demandes WhatsApp' })).toBeInTheDocument()
    expect(screen.getByText(/ne sont pas des commandes/)).toBeInTheDocument()
    expect(screen.getByText(/Prix et disponibilité · couleur noir · taille M/)).toBeInTheDocument()
    expect(screen.queryByText(/taille L/)).not.toBeInTheDocument() // filtre « À traiter » par défaut
    await u.type(screen.getByLabelText('Note de suivi'), 'répondu, attend sa taille')
    await u.click(within(screen.getByRole('group', { name: 'Suivi de la demande' })).getByRole('button', { name: 'Traitée' }))
    expect(await screen.findByText(/Demande marquée « Traitée »/)).toBeInTheDocument()
    expect(appels.ecritures.some(e => JSON.stringify(e).includes('demandes_whatsapp') && JSON.stringify(e).includes('traitee'))).toBe(true)
  })
})
