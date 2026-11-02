import { obtenirSupabase } from '@/lib/supabase'
import { ecrireAdresses, ecrirePanier, ecrireProfil, lireAdresses, lireCommandes, lirePanier, lireProfil } from '@/lib/compteDistant'
import { fusionnerLignes, usePanier } from '@/state/panier'
import { useCompte } from '@/state/compte'
import { useSession, type UtilisateurSession } from '@/state/session'

/** Synchronisation du compte connecté avec Supabase (ADR 0005).
 *  - Connexion : le panier du compte est chargé ; un panier visiteur est fusionné avec lui (une seule fois).
 *    Profil, adresses et commandes viennent de la base ; un profil ou des adresses saisis en visiteur complètent un compte vide.
 *  - Ensuite : chaque changement du panier, du profil ou des adresses est enregistré (regroupé sur 400 ms).
 *  - Déconnexion : panier et compte sont vidés de l'appareil (ils restent dans le compte), pour le client suivant. */
const DELAI = 400
let uid: string | null = null
let enChargement = false
const minuteries: Partial<Record<'panier' | 'profil' | 'adresses', number>> = {}
let adressesRetirees = new Set<string>()

const signalerErreur = (e: unknown) => {
  console.warn('[compte] synchronisation :', e)
  useSession.setState({ erreurSynchro: 'Enregistrement dans votre compte impossible pour le moment. Vos modifications restent sur cet appareil.' })
}

async function pousser(quoi: 'panier' | 'profil' | 'adresses') {
  const sb = await obtenirSupabase()
  const id = uid
  if (!sb || !id) return
  try {
    if (quoi === 'panier') await ecrirePanier(sb, id, usePanier.getState().lignes)
    if (quoi === 'profil') await ecrireProfil(sb, id, useCompte.getState().profil)
    if (quoi === 'adresses') {
      const retirees = [...adressesRetirees]
      adressesRetirees = new Set()
      await ecrireAdresses(sb, id, useCompte.getState().adresses, retirees)
    }
    useSession.setState({ erreurSynchro: null })
  } catch (e) { signalerErreur(e) }
}
function planifier(quoi: 'panier' | 'profil' | 'adresses') {
  if (!uid || enChargement) return
  window.clearTimeout(minuteries[quoi])
  minuteries[quoi] = window.setTimeout(() => void pousser(quoi), DELAI)
}
/** Envoie tout de suite ce qui attend (avant une déconnexion ou une commande). */
export async function viderFileSynchro() {
  const enAttente = (Object.keys(minuteries) as (keyof typeof minuteries)[]).filter(k => minuteries[k] !== undefined)
  enAttente.forEach(k => { window.clearTimeout(minuteries[k]); delete minuteries[k] })
  await Promise.all(enAttente.map(pousser))
}

async function surConnexion(u: UtilisateurSession) {
  const sb = await obtenirSupabase()
  if (!sb) return
  enChargement = true
  try {
    const [panierDistant, profilDistant, adressesDistantes, commandes] = await Promise.all([lirePanier(sb), lireProfil(sb), lireAdresses(sb), lireCommandes(sb)])
    const panier = usePanier.getState()
    const compte = useCompte.getState()
    // Panier : celui du compte fait foi ; un panier visiteur (sans propriétaire) s'y ajoute une seule fois.
    const visiteur = panier.proprietaire === null
    const lignes = visiteur ? fusionnerLignes(panierDistant, panier.lignes) : panierDistant
    usePanier.getState().remplacer(lignes, u.id)
    // Profil et adresses : la base fait foi ; les saisies faites en visiteur complètent un compte encore vide.
    const local = compte.proprietaire === null ? compte : null
    const profil = {
      nom: profilDistant?.nom || local?.profil.nom || u.nom,
      telephone: profilDistant?.telephone || local?.profil.telephone || '',
      email: profilDistant?.email || local?.profil.email || u.email,
    }
    const adresses = adressesDistantes.length ? adressesDistantes : (local?.adresses ?? [])
    useCompte.setState({ profil, adresses, commandes, proprietaire: u.id })
    uid = u.id
    enChargement = false
    if (visiteur && panier.lignes.length) await pousser('panier')
    if (JSON.stringify(profil) !== JSON.stringify(profilDistant ?? null)) await pousser('profil')
    if (!adressesDistantes.length && adresses.length) await pousser('adresses')
    useSession.setState({ erreurSynchro: null })
  } catch (e) {
    signalerErreur(e)
  } finally {
    enChargement = false
  }
}

function surDeconnexion() {
  Object.values(minuteries).forEach(t => window.clearTimeout(t))
  for (const k of Object.keys(minuteries)) delete minuteries[k as keyof typeof minuteries]
  uid = null
  adressesRetirees = new Set()
  usePanier.getState().remplacer([], null)
  useCompte.getState().toutEffacer()
  useSession.setState({ erreurSynchro: null })
}

/** Recharge l'historique des commandes depuis la base (page « Commandes » du compte). */
export async function rafraichirCommandes() {
  const sb = await obtenirSupabase()
  if (!sb || !uid) return
  try { useCompte.setState({ commandes: await lireCommandes(sb) }) } catch (e) { signalerErreur(e) }
}

let branche = false
/** À appeler une fois au démarrage du site (App). Renvoie de quoi se débrancher (tests). */
export function brancherSynchroCompte() {
  if (branche) return () => {}
  branche = true
  const arrets = [
    useSession.subscribe((s, avant) => {
      const id = s.utilisateur?.id ?? null
      const idAvant = avant.utilisateur?.id ?? null
      if (id === idAvant) return
      if (idAvant) surDeconnexion()
      if (s.utilisateur) void surConnexion(s.utilisateur)
    }),
    usePanier.subscribe((s, avant) => { if (s.lignes !== avant.lignes) planifier('panier') }),
    useCompte.subscribe((s, avant) => {
      if (s.profil !== avant.profil) planifier('profil')
      if (s.adresses !== avant.adresses) {
        for (const a of avant.adresses) if (!s.adresses.some(x => x.id === a.id)) adressesRetirees.add(a.id)
        planifier('adresses')
      }
    }),
  ]
  const deja = useSession.getState().utilisateur
  if (deja) void surConnexion(deja)
  return () => { arrets.forEach(f => f()); branche = false; uid = null }
}
