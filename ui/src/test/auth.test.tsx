import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/** Faux client Supabase : on vérifie les appels et on simule les réponses (aucun réseau). */
type Ecouteur = (evenement: string, session: unknown) => void
const etat = { session: null as null | { user: { id: string; email: string; user_metadata: { nom: string } } }, ecouteurs: [] as Ecouteur[] }
const utilisateur = (email: string, nom = 'Sara Alaoui') => ({ id: `id-${email}`, email, user_metadata: { nom } })
const emettre = (e: string) => etat.ecouteurs.forEach(f => f(e, etat.session))
const auth = {
  getSession: vi.fn(async () => ({ data: { session: etat.session } })),
  onAuthStateChange: vi.fn((f: Ecouteur) => { etat.ecouteurs.push(f); return { data: { subscription: { unsubscribe() {} } } } }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(async () => { etat.session = null; emettre('SIGNED_OUT'); return { error: null } }),
  resetPasswordForEmail: vi.fn(async () => ({ error: null })),
  updateUser: vi.fn(async () => ({ error: null })),
  resend: vi.fn(async () => ({ error: null })),
}
const memoriserSession = vi.fn()
// Tables vides : la synchro du compte (lot 6) lit et écrit sans erreur.
const requete: Record<string, unknown> = {}
for (const m of ['select', 'eq', 'in', 'order', 'maybeSingle', 'update', 'upsert', 'delete']) requete[m] = () => requete
requete.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(ok)
vi.mock('@/lib/supabase', () => ({ supabaseActif: true, memoriserSession, obtenirSupabase: async () => ({ auth, from: () => requete }) }))

window.scrollTo = vi.fn() as never
class IO { observe() {} unobserve() {} disconnect() {} }
;(window as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO
window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) as never

const { default: App } = await import('@/App')
const { FournisseurAnimations } = await import('@/state/animations')
const { FournisseurNotifications } = await import('@/design-system')
const { useSession } = await import('@/state/session')
const { retourSur } = await import('@/features/compte/PageConnexion')

const monter = (url: string) => render(
  <MemoryRouter initialEntries={[url]}><FournisseurAnimations><FournisseurNotifications><App /></FournisseurNotifications></FournisseurAnimations></MemoryRouter>)

describe('comptes : connexion, inscription, session', () => {
  beforeEach(() => {
    sessionStorage.setItem('hmode-vu', '1')
    etat.session = null
    useSession.setState({ utilisateur: null, pret: true, recuperation: false })
    vi.clearAllMocks()
  })

  it('inscription : erreurs de la référence, puis appel Supabase et écran « vérifiez vos e-mails »', async () => {
    const u = userEvent.setup()
    auth.signUp.mockResolvedValueOnce({ data: { user: { ...utilisateur('sara@exemple.ma'), identities: [{}] }, session: null }, error: null })
    monter('/connexion?mode=inscription')
    await u.click(await screen.findByRole('button', { name: 'Créer un compte' }))
    expect(screen.getAllByText('Requis')).toHaveLength(2)
    expect(screen.getByText('Entrez un email valide')).toBeInTheDocument()
    expect(screen.getByText('Min 8 caractères')).toBeInTheDocument()
    expect(screen.getByText('Acceptez les conditions pour continuer')).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
    await u.type(screen.getByLabelText('Prénom'), 'Sara')
    await u.type(screen.getByLabelText('Nom'), 'Alaoui')
    await u.type(screen.getByLabelText('Adresse email'), 'sara@exemple.ma')
    await u.type(screen.getByLabelText('Mot de passe'), 'motdepasse1')
    await u.type(screen.getByLabelText('Confirmer le mot de passe'), 'autre')
    await u.click(screen.getByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: 'Créer un compte' }))
    expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
    await u.clear(screen.getByLabelText('Confirmer le mot de passe'))
    await u.type(screen.getByLabelText('Confirmer le mot de passe'), 'motdepasse1')
    await u.click(screen.getByRole('button', { name: 'Créer un compte' }))
    expect(await screen.findByRole('heading', { name: 'Vérifiez vos e-mails' })).toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'sara@exemple.ma', password: 'motdepasse1',
      options: { data: { nom: 'Sara Alaoui' }, emailRedirectTo: 'http://localhost:3000/connexion?confirme=1' } })
  })

  it('inscription : adresse déjà inscrite (réponse sans identité) → message clair', async () => {
    const u = userEvent.setup()
    auth.signUp.mockResolvedValueOnce({ data: { user: { ...utilisateur('sara@exemple.ma'), identities: [] }, session: null }, error: null })
    monter('/connexion?mode=inscription')
    await u.type(await screen.findByLabelText('Prénom'), 'Sara')
    await u.type(screen.getByLabelText('Nom'), 'Alaoui')
    await u.type(screen.getByLabelText('Adresse email'), 'sara@exemple.ma')
    await u.type(screen.getByLabelText('Mot de passe'), 'motdepasse1')
    await u.type(screen.getByLabelText('Confirmer le mot de passe'), 'motdepasse1')
    await u.click(screen.getByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: 'Créer un compte' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Un compte existe déjà avec cette adresse e-mail.')
  })

  it('connexion : identifiants refusés, puis connexion, retour demandé, déconnexion', async () => {
    const u = userEvent.setup()
    auth.signInWithPassword
      .mockResolvedValueOnce({ data: { user: null, session: null }, error: Object.assign(new Error('Invalid login credentials'), { code: 'invalid_credentials' }) })
      .mockImplementationOnce(async ({ email }: { email: string }) => { etat.session = { user: utilisateur(email) }; return { data: { user: etat.session.user, session: etat.session }, error: null } })
    monter('/connexion?retour=/compte/adresses')
    await u.type(await screen.findByLabelText('Adresse email'), 'sara@exemple.ma')
    await u.type(screen.getByLabelText('Mot de passe'), 'faux-mdp')
    await u.click(screen.getByRole('checkbox', { name: 'Se souvenir de moi' }))
    await u.click(screen.getByRole('button', { name: 'Connexion' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou mot de passe incorrect.')
    expect(memoriserSession).toHaveBeenLastCalledWith(false)
    await u.click(screen.getByRole('button', { name: 'Connexion' }))
    expect(await screen.findByText('sara@exemple.ma')).toBeInTheDocument() // bandeau « Connecté · … » du compte
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Compte' })).toHaveAttribute('href', '/compte')
    await u.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect(auth.signOut).toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Bon retour' })).toBeInTheDocument()
  })

  it('session restaurée après actualisation : /connexion renvoie au compte, en-tête « Compte »', async () => {
    useSession.setState({ utilisateur: null, pret: false })
    monter('/connexion')
    await useSession.getState().demarrer()
    // Supabase relit la session stockée et l'annonce (INITIAL_SESSION) : comme après une actualisation.
    etat.session = { user: utilisateur('karim@exemple.ma', 'Karim B') }
    emettre('INITIAL_SESSION')
    expect(await screen.findByText('karim@exemple.ma')).toBeInTheDocument()
  })

  it('mot de passe oublié : lien envoyé sans révéler si le compte existe', async () => {
    const u = userEvent.setup()
    monter('/connexion')
    await u.click(await screen.findByRole('button', { name: 'Mot de passe oublié ?' }))
    await u.type(screen.getByLabelText('Adresse email'), 'inconnu@exemple.ma')
    await u.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('inconnu@exemple.ma', { redirectTo: 'http://localhost:3000/connexion/nouveau-mot-de-passe' })
    expect(await screen.findByText(/Si un compte existe pour inconnu@exemple\.ma/)).toBeInTheDocument()
  })

  it('retour après connexion : chemins internes seulement', () => {
    expect(retourSur('/commande')).toBe('/commande')
    expect(retourSur('//pirate.example')).toBe('/compte')
    expect(retourSur('https://pirate.example')).toBe('/compte')
    expect(retourSur(null)).toBe('/compte')
  })
})
