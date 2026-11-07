import { create } from 'zustand'
import type { AuthError, User } from '@supabase/supabase-js'
import { memoriserSession, obtenirSupabase, supabaseActif } from '@/lib/supabase'

/** Session du compte client (Supabase Auth). La session elle-même est gardée par Supabase (`hmode-session`) ;
 *  ce magasin n'en garde que l'utilisateur affiché. `pret` passe à vrai une fois la session restaurée (ou absente). */
export interface UtilisateurSession { id: string; email: string; nom: string }
type Resultat = { erreur?: string; code?: string }

interface EtatSession {
  utilisateur: UtilisateurSession | null
  pret: boolean
  /** Arrivée depuis le lien « mot de passe oublié » : la page propose de choisir un nouveau mot de passe. */
  recuperation: boolean
  /** Dernière erreur d'enregistrement du compte (panier, profil, adresses) ; `null` si tout est à jour. */
  erreurSynchro: string | null
  demarrer: () => Promise<void>
  connexion: (email: string, motDePasse: string, souvenir: boolean) => Promise<Resultat>
  inscription: (d: { prenom: string; nom: string; email: string; motDePasse: string }) => Promise<Resultat & { confirmationRequise?: boolean }>
  deconnexion: () => Promise<void>
  motDePasseOublie: (email: string) => Promise<Resultat>
  nouveauMotDePasse: (motDePasse: string) => Promise<Resultat>
  renvoyerConfirmation: (email: string) => Promise<Resultat>
}

const versUtilisateur = (u: User | null | undefined): UtilisateurSession | null =>
  u ? { id: u.id, email: u.email ?? '', nom: String(u.user_metadata?.nom ?? '') } : null

/** Messages en français pour les codes d'erreur Supabase Auth. */
export function messageErreur(e: AuthError | Error | null | undefined): Resultat {
  if (!e) return {}
  const code = (e as AuthError).code ?? ''
  const messages: Record<string, string> = {
    invalid_credentials: 'E-mail ou mot de passe incorrect.',
    email_not_confirmed: 'Confirmez d\'abord votre adresse e-mail : ouvrez le lien reçu par e-mail.',
    user_already_exists: 'Un compte existe déjà avec cette adresse e-mail.',
    email_exists: 'Un compte existe déjà avec cette adresse e-mail.',
    weak_password: 'Mot de passe trop faible : 8 caractères minimum, mélangez lettres et chiffres.',
    same_password: 'Le nouveau mot de passe doit être différent de l\'ancien.',
    over_email_send_rate_limit: 'Trop d\'e-mails envoyés. Réessayez dans quelques minutes.',
    over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
    email_address_invalid: 'Adresse e-mail refusée. Vérifiez-la.',
    signup_disabled: 'Les inscriptions sont fermées pour le moment.',
    session_not_found: 'Votre session a expiré. Reconnectez-vous.',
  }
  if (messages[code]) return { erreur: messages[code], code }
  if (/fetch|network/i.test(e.message)) return { erreur: 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.', code: 'reseau' }
  return { erreur: 'Une erreur est survenue. Réessayez.', code }
}

const SANS_SERVEUR: Resultat = { erreur: 'Les comptes ne sont pas disponibles sur cette version du site.', code: 'sans_serveur' }
const origine = () => window.location.origin

let demarre = false
export const useSession = create<EtatSession>()((set) => ({
  utilisateur: null,
  pret: !supabaseActif,
  recuperation: false,
  erreurSynchro: null,

  demarrer: async () => {
    if (demarre) return
    demarre = true
    const sb = await obtenirSupabase()
    if (!sb) { set({ pret: true }); return }
    sb.auth.onAuthStateChange((evenement, session) => {
      set({ utilisateur: versUtilisateur(session?.user), pret: true, ...(evenement === 'PASSWORD_RECOVERY' && { recuperation: true }) })
    })
    const { data } = await sb.auth.getSession()
    set({ utilisateur: versUtilisateur(data.session?.user), pret: true })
  },

  connexion: async (email, motDePasse, souvenir) => {
    const sb = await obtenirSupabase()
    if (!sb) return SANS_SERVEUR
    memoriserSession(souvenir)
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
    if (error) return messageErreur(error)
    set({ utilisateur: versUtilisateur(data.user) })
    return {}
  },

  inscription: async ({ prenom, nom, email, motDePasse }) => {
    const sb = await obtenirSupabase()
    if (!sb) return SANS_SERVEUR
    memoriserSession(true)
    const { data, error } = await sb.auth.signUp({
      email: email.trim(), password: motDePasse,
      options: { data: { nom: `${prenom.trim()} ${nom.trim()}`.trim() }, emailRedirectTo: `${origine()}/connexion?confirme=1` },
    })
    if (error) return messageErreur(error)
    // Confirmation d'e-mail active + adresse déjà inscrite : Supabase répond sans erreur, avec un utilisateur sans identité.
    if (data.user && data.user.identities?.length === 0) return { erreur: 'Un compte existe déjà avec cette adresse e-mail.', code: 'user_already_exists' }
    if (!data.session) return { confirmationRequise: true }
    set({ utilisateur: versUtilisateur(data.user) })
    return {}
  },

  deconnexion: async () => {
    const sb = await obtenirSupabase()
    if (sb) await sb.auth.signOut()
    set({ utilisateur: null, recuperation: false })
  },

  motDePasseOublie: async email => {
    const sb = await obtenirSupabase()
    if (!sb) return SANS_SERVEUR
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origine()}/connexion/nouveau-mot-de-passe` })
    return messageErreur(error)
  },

  nouveauMotDePasse: async motDePasse => {
    const sb = await obtenirSupabase()
    if (!sb) return SANS_SERVEUR
    const { error } = await sb.auth.updateUser({ password: motDePasse })
    if (!error) set({ recuperation: false })
    return messageErreur(error)
  },

  renvoyerConfirmation: async email => {
    const sb = await obtenirSupabase()
    if (!sb) return SANS_SERVEUR
    const { error } = await sb.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${origine()}/connexion?confirme=1` } })
    return messageErreur(error)
  },
}))
