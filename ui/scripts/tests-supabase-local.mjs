// Tests de bout en bout sur le Supabase LOCAL (Docker, `npx supabase start`), jamais sur le projet en ligne.
// Vérifie avec de vrais comptes : inscription + confirmation d'e-mail, profil, panier, adresses, commandes,
// et surtout l'isolation (RLS) entre deux clients et vis-à-vis d'un visiteur.
// Usage : cd ui && node --env-file=.env.supabase-local scripts/tests-supabase-local.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
if (!url || !/127\.0\.0\.1|localhost/.test(url)) { console.error('Refusé : ce script ne tourne que sur un Supabase local.'); process.exit(1) }

let echecs = 0
const verdict = (ok, libelle, detail = '') => { if (!ok) echecs++; console.log(`${ok ? '✓' : '✗'} ${libelle}${detail ? ` — ${detail}` : ''}`) }
const client = () => createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } })
const suffixe = Date.now().toString(36)
const MDP = `Essai-${suffixe}-9`

/** Ouvre le lien de confirmation reçu dans la boîte de test (Mailpit). */
async function confirmerEmail(email) {
  for (let i = 0; i < 20; i++) {
    const liste = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`).then(r => r.json())
    const m = liste.messages?.[0]
    if (m) {
      const corps = await fetch(`${MAILPIT}/api/v1/message/${m.ID}`).then(r => r.json())
      const lien = (corps.Text.match(/https?:\/\/\S+verify\S+/) ?? [])[0]?.replace(/[)\]>]+$/, '')
      if (!lien) throw new Error('lien de confirmation introuvable')
      const r = await fetch(lien, { redirect: 'manual' })
      return { lien, statut: r.status, redirection: r.headers.get('location') ?? '' }
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`aucun e-mail reçu pour ${email}`)
}

async function inscrire(prenomNom, email) {
  const sb = client()
  const { data, error } = await sb.auth.signUp({ email, password: MDP, options: { data: { nom: prenomNom }, emailRedirectTo: 'http://localhost:6013/connexion?confirme=1' } })
  verdict(!error && data.user && !data.session, `inscription ${email} : compte créé, session refusée avant confirmation`, error?.message)
  const refus = await sb.auth.signInWithPassword({ email, password: MDP })
  verdict(refus.error?.code === 'email_not_confirmed', `connexion avant confirmation refusée (${email})`, refus.error?.code)
  const c = await confirmerEmail(email)
  verdict(c.statut === 303 && c.redirection.startsWith('http://localhost:6013/connexion'), `lien de confirmation → retour sur /connexion (${email})`, `${c.statut} ${c.redirection.slice(0, 60)}`)
  const connexion = await sb.auth.signInWithPassword({ email, password: MDP })
  verdict(!connexion.error, `connexion après confirmation (${email})`, connexion.error?.message)
  return { sb, id: connexion.data.user.id }
}

const A = await inscrire('Sara Alaoui', `sara.${suffixe}@exemple.ma`)
const B = await inscrire('Karim Bennani', `karim.${suffixe}@exemple.ma`)
const visiteur = client()

// Profil créé à l'inscription, modifiable par son seul propriétaire
const pA = await A.sb.from('profils').select('nom, email').maybeSingle()
verdict(pA.data?.nom === 'Sara Alaoui', 'profil créé automatiquement avec le nom saisi', JSON.stringify(pA.data))
await A.sb.from('profils').update({ telephone: '0612345678' }).eq('id', A.id)
const pA2 = await A.sb.from('profils').select('telephone').maybeSingle()
verdict(pA2.data?.telephone === '0612345678', 'profil : modification enregistrée')
await B.sb.from('profils').update({ nom: 'Piraté' }).eq('id', A.id)
const pA3 = await A.sb.from('profils').select('nom').maybeSingle()
verdict(pA3.data?.nom === 'Sara Alaoui', 'isolation : B ne peut pas modifier le profil de A')
const pB = await B.sb.from('profils').select('id')
verdict(pB.data?.length === 1 && pB.data[0].id === B.id, 'isolation : B ne lit que son propre profil')

// Panier
const ligne = { slug: 't-shirt-dior-logo', coloris: 'noir', taille: 'M', quantite: 2 }
const up = await A.sb.from('paniers').upsert({ utilisateur: A.id, lignes: [ligne] })
verdict(!up.error, 'panier de A enregistré', up.error?.message)
const pirate = await B.sb.from('paniers').upsert({ utilisateur: A.id, lignes: [] })
verdict(Boolean(pirate.error), 'isolation : B ne peut pas écraser le panier de A', pirate.error?.code)
const panierB = await B.sb.from('paniers').select('lignes')
verdict(panierB.data?.length === 0, 'isolation : B ne voit aucun panier (pas encore le sien)')
// Reconnexion de A sur un « autre appareil » : panier retrouvé
const A2 = client(); await A2.auth.signInWithPassword({ email: `sara.${suffixe}@exemple.ma`, password: MDP })
const panierA = await A2.from('paniers').select('lignes').maybeSingle()
// jsonb range les clés à sa façon : comparaison champ par champ
const l0 = panierA.data?.lignes?.[0] ?? {}
verdict(panierA.data?.lignes?.length === 1 && Object.entries(ligne).every(([k, v]) => l0[k] === v), 'panier retrouvé après reconnexion (autre session)', JSON.stringify(panierA.data?.lignes))

// Adresses
const adr = await A.sb.from('adresses').insert({ libelle: 'Maison', ville: 'Rabat', adresse: '4 avenue Mohammed V', par_defaut: true }).select('id').single()
verdict(!adr.error, 'adresse de A enregistrée', adr.error?.message)
await B.sb.from('adresses').delete().eq('id', adr.data.id)
const encore = await A.sb.from('adresses').select('id')
verdict(encore.data?.length === 1, 'isolation : B ne peut pas supprimer l\'adresse de A')
const adrB = await B.sb.from('adresses').select('id')
verdict(adrB.data?.length === 0, 'isolation : B ne voit pas les adresses de A')

// Commandes
const commande = (reference, lignes = [{ slug: 't-shirt-dior-logo', nom: 'T-shirt logo Dior', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 450 }]) => ({ commande: {
  reference, client: { nom: 'Sara Alaoui', telephone: '0612345678', email: '', ville: 'Rabat', adresse: '4 avenue Mohammed V', instructions: '' }, lignes } })
const refA = `HM-TEST-${suffixe}`
const rpcA = await A.sb.rpc('passer_commande', commande(refA))
verdict(rpcA.data === refA && !rpcA.error, 'commande de A enregistrée par passer_commande', rpcA.error?.message)
const cmdA = await A.sb.from('commandes').select('reference, utilisateur, mode_paiement, statut, sous_total_dh, lignes_commande(quantite, prix_dh)')
verdict(cmdA.data?.length === 1 && cmdA.data[0].utilisateur === A.id && cmdA.data[0].sous_total_dh === 900 && cmdA.data[0].lignes_commande.length === 1,
  'commande lue par A : rattachée à son compte, total calculé par la base (900 DH), lignes présentes', JSON.stringify(cmdA.data?.[0]))
verdict(cmdA.data?.[0].mode_paiement === 'livraison' && cmdA.data?.[0].statut === 'nouvelle', 'paiement à la livraison, statut « nouvelle »')
const cmdB = await B.sb.from('commandes').select('reference')
const lignesB = await B.sb.from('lignes_commande').select('id')
verdict(cmdB.data?.length === 0 && lignesB.data?.length === 0, 'isolation : B ne voit ni les commandes ni les lignes de A')
const cmdV = await visiteur.from('commandes').select('reference')
verdict(Boolean(cmdV.error) || cmdV.data?.length === 0, 'isolation : un visiteur ne lit aucune commande', cmdV.error?.code)
const directe = await B.sb.from('commandes').insert({ reference: `HM-PIRATE-${suffixe}`, nom: 'x', telephone: '0600000000', ville: 'x', adresse: 'xxxxxx', sous_total_dh: 0 })
verdict(Boolean(directe.error), 'écriture directe dans commandes refusée (même connecté)', directe.error?.code)
const fausse = await B.sb.from('commandes').update({ statut: 'livree' }).eq('reference', refA)
const statut = await A.sb.from('commandes').select('statut').maybeSingle()
verdict(statut.data?.statut === 'nouvelle', 'isolation : B ne peut pas changer le statut d\'une commande de A', fausse.error?.code)

// Commande sans compte, et refus atomique d'une commande invalide
const refV = `HM-INVITE-${suffixe}`
const rpcV = await visiteur.rpc('passer_commande', commande(refV))
verdict(rpcV.data === refV, 'commande sans compte enregistrée', rpcV.error?.message)
const refInv = `HM-INVALIDE-${suffixe}`
const rpcInv = await A.sb.rpc('passer_commande', commande(refInv, [{ slug: 'x', nom: 'x', coloris: 'noir', taille: 'M', quantite: 0, prix_dh: 100 }]))
const orpheline = await A.sb.from('commandes').select('reference').eq('reference', refInv)
verdict(Boolean(rpcInv.error) && orpheline.data?.length === 0, 'quantité 0 refusée, et aucune commande orpheline (transaction annulée)', rpcInv.error?.code)
const doublon = await A.sb.rpc('passer_commande', commande(refA))
verdict(Boolean(doublon.error), 'référence en double refusée', doublon.error?.code)

console.log(echecs ? `\n${echecs} échec(s)` : '\nTout est vert.')
process.exit(echecs ? 1 : 0)
