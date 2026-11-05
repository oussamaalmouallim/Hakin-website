import { obtenirSupabase } from '@/lib/supabase'
import { ecrireAdresses, ecrireFavoris, ecrirePanier, ecrireProfil, lireAdresses, lireCommandes, lireFavoris, lirePanier, lireProfil } from '@/lib/compteDistant'
import { trouverProduit } from '@/lib/catalogue'
import { fusionnerLignes, usePanier } from '@/state/panier'
import { fusionnerFavoris, useFavoris } from '@/state/favoris'
import { useCompte } from '@/state/compte'
import { useSession, type UtilisateurSession } from '@/state/session'

/** Synchronisation du compte connecté avec Supabase (ADR 0005).
 *  - Connexion : le panier et les favoris du compte sont chargés ; ceux du visiteur s'y ajoutent (une seule fois).
 *    Profil, adresses et commandes viennent de la base ; un profil ou des adresses saisis en visiteur complètent un compte vide.
 *  - Ensuite : chaque changement du panier, des favoris, du profil ou des adresses est enregistré (regroupé sur 400 ms).
 *  - Déconnexion : panier, favoris et compte sont vidés de l'appareil (ils restent dans le compte), pour le client suivant. */
const DELAI = 400
let uid: string | null = null
let enChargement = false
type Quoi = 'panier' | 'favoris' | 'profil' | 'adresses'
const minuteries: Partial<Record<Quoi, number>> = {}
let adressesRetirees = new Set<string>()
/** Favoris tels qu'enregistrés dans le compte : l'écart avec l'appareil donne les ajouts et retraits à envoyer. */
let favorisEnBase: string[] = []

const signalerErreur = (e: unknown) => {
  console.warn('[compte] synchronisation :', e)
  useSession.setState({ erreurSynchro: 'Enregistrement dans votre compte impossible pour le moment. Vos modifications restent sur cet appareil.' })
}

async function pousser(quoi: Quoi) {
  const sb = await obtenirSupabase()
  const id = uid
  if (!sb || !id) return
  try {
    if (quoi === 'panier') await ecrirePanier(sb, id, usePanier.getState().lignes)
    if (quoi === 'favoris') {
      const slugs = useFavoris.getState().slugs
      await ecrireFavoris(sb, id, slugs.filter(x => !favorisEnBase.includes(x)), favorisEnBase.filter(x => !slugs.includes(x)))
      favorisEnBase = slugs
    }
    if (quoi === 'profil') await ecrireProfil(sb, id, useCompte.getState().profil)
    if (quoi === 'adresses') {
      const retirees = [...adressesRetirees]
      adressesRetirees = new Set()
      await ecrireAdresses(sb, id, useCompte.getState().adresses, retirees)
    }
    useSession.setState({ erreurSynchro: null })
  } catch (e) { signalerErreur(e) }
}
function planifier(quoi: Quoi) {
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
    const [panierDistant, favorisDistants, profilDistant, adressesDistantes, commandes] = await Promise.all([lirePanier(sb), lireFavoris(sb), lireProfil(sb), lireAdresses(sb), lireCommandes(sb)])
    const panier = usePanier.getState()
    const compte = useCompte.getState()
    // Panier : celui du compte fait foi ; un panier visiteur (sans propriétaire) s'y ajoute une seule fois.
    const visiteur = panier.proprietaire === null
    const lignes = visiteur ? fusionnerLignes(panierDistant, panier.lignes) : panierDistant
    usePanier.getState().remplacer(lignes, u.id)
    // Favoris : même règle que le panier ; une pièce retirée du catalogue n'est pas reprise.
    const favoris = useFavoris.getState()
    const favorisVisiteur = favoris.proprietaire === null
    useFavoris.getState().remplacer(fusionnerFavoris(favorisDistants, favorisVisiteur ? favoris.slugs : [], slug => !!trouverProduit(slug)), u.id)
    favorisEnBase = favorisDistants
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
    if (useFavoris.getState().slugs.join() !== favorisDistants.join()) await pousser('favoris')
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
  favorisEnBase = []
  usePanier.getState().remplacer([], null)
  useFavoris.getState().remplacer([], null)
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
    useFavoris.subscribe((s, avant) => { if (s.slugs !== avant.slugs) planifier('favoris') }),
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
  return () => { arrets.forEach(f => f()); branche = false; uid = null; favorisEnBase = [] }
}
