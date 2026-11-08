// Tests de bout en bout sur le Supabase LOCAL (Docker, `npx supabase start`), jamais sur le projet en ligne.
// Vérifie avec de vrais comptes : inscription + confirmation d'e-mail, profil, panier, adresses, commandes,
// et surtout l'isolation (RLS) entre deux clients et vis-à-vis d'un visiteur.
// Usage : cd web && node --env-file=.env.supabase-local scripts/tests-supabase-local.mjs
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import bcrypt from 'bcryptjs'

const url = process.env.VITE_SUPABASE_URL
const cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
if (!url || !/127\.0\.0\.1|localhost/.test(url)) { console.error('Refusé : ce script ne tourne que sur un Supabase local.'); process.exit(1) }

let echecs = 0
const verdict = (ok, libelle, detail = '') => { if (!ok) echecs++; console.log(`${ok ? '✓' : '✗'} ${libelle}${detail ? ` — ${detail}` : ''}`) }
const client = () => createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } })
const suffixe = Date.now().toString(36)
const MDP = `Essai-${suffixe}-9`
const psql = sql => execFileSync('docker', ['exec', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', sql], { encoding: 'utf8' }).trim()

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

// Favoris (lot 19)
const favA = await A.sb.from('favoris').upsert([{ utilisateur: A.id, slug: 't-shirt-dior-logo' }, { utilisateur: A.id, slug: 't-shirt-prada-graffiti' }], { onConflict: 'utilisateur,slug', ignoreDuplicates: true })
verdict(!favA.error, 'favoris de A enregistrés', favA.error?.message)
const favDoublon = await A.sb.from('favoris').upsert([{ utilisateur: A.id, slug: 't-shirt-dior-logo' }], { onConflict: 'utilisateur,slug', ignoreDuplicates: true })
const favA2 = await A2.from('favoris').select('slug').order('cree_le')
verdict(!favDoublon.error && favA2.data?.length === 2, 'favoris retrouvés sur une autre session, sans doublon', JSON.stringify(favA2.data))
const favPirate = await B.sb.from('favoris').insert({ utilisateur: A.id, slug: 'pirate' })
verdict(Boolean(favPirate.error), 'isolation : B ne peut pas ajouter un favori au compte de A', favPirate.error?.code)
await B.sb.from('favoris').delete().eq('slug', 't-shirt-dior-logo')
const favB = await B.sb.from('favoris').select('slug')
const favA3 = await A.sb.from('favoris').select('slug')
verdict(favB.data?.length === 0 && favA3.data?.length === 2, 'isolation : B ne voit ni ne supprime les favoris de A')
const favV = await visiteur.from('favoris').select('slug')
verdict(Boolean(favV.error) || favV.data?.length === 0, 'isolation : un visiteur ne lit aucun favori', favV.error?.code)
const favRetrait = await A.sb.from('favoris').delete().in('slug', ['t-shirt-prada-graffiti'])
const favA4 = await A.sb.from('favoris').select('slug')
verdict(!favRetrait.error && favA4.data?.length === 1 && favA4.data[0].slug === 't-shirt-dior-logo', 'favori retiré par A', favRetrait.error?.message)

// Adresses
const adr = await A.sb.from('adresses').insert({ libelle: 'Maison', ville: 'Rabat', adresse: '4 avenue Mohammed V', par_defaut: true }).select('id').single()
verdict(!adr.error, 'adresse de A enregistrée', adr.error?.message)
await B.sb.from('adresses').delete().eq('id', adr.data.id)
const encore = await A.sb.from('adresses').select('id')
verdict(encore.data?.length === 1, 'isolation : B ne peut pas supprimer l\'adresse de A')
const adrB = await B.sb.from('adresses').select('id')
verdict(adrB.data?.length === 0, 'isolation : B ne voit pas les adresses de A')

// Commandes
// Pièce de catalogue créée pour l'essai (passer_commande v3 refuse toute pièce absente de la table `produits`).
// Les compteurs de limite « commande » sont remis à zéro : tous les appels locaux viennent de la même adresse.
const CATALOGUE = `essai-catalogue-${suffixe}`
psql(`insert into public.produits (slug, nom, categorie, prix_dh, publie, coloris, tailles) values ('${CATALOGUE}', 'T-shirt d''essai', 't-shirts', 450, true, '[{"nom":"noir","hex":"#000000"}]', '[{"taille":"M","disponible":true},{"taille":"XL","disponible":false}]')`)
psql(`delete from public.limites_evenements where action = 'commande'`)
const villesLivrees = JSON.parse(psql(`select coalesce(valeur -> 'livraison' -> 'villes', 'null') from public.reglages where cle = 'boutique'`) || 'null')
const VILLE = Array.isArray(villesLivrees) ? villesLivrees[0] : 'Rabat'
const commande = (reference, lignes = [{ slug: CATALOGUE, nom: 'nom envoyé par le navigateur', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 1 }], ville = VILLE) => ({ commande: {
  reference, client: { nom: 'Sara Alaoui', telephone: '0612345678', email: '', ville, adresse: '4 avenue Mohammed V', instructions: '' }, lignes } })
const refA = `HM-TEST-${suffixe}`
const rpcA = await A.sb.rpc('passer_commande', commande(refA))
verdict(rpcA.data === refA && !rpcA.error, 'commande de A enregistrée par passer_commande', rpcA.error?.message)
const cmdA = await A.sb.from('commandes').select('reference, utilisateur, mode_paiement, statut, sous_total_dh, lignes_commande(nom, quantite, prix_dh)')
verdict(cmdA.data?.length === 1 && cmdA.data[0].utilisateur === A.id && cmdA.data[0].sous_total_dh === 900 && cmdA.data[0].lignes_commande.length === 1,
  'commande lue par A : rattachée à son compte, total calculé par la base (900 DH, prix envoyé 1 DH ignoré), lignes présentes', JSON.stringify(cmdA.data?.[0]))
verdict(cmdA.data?.[0].lignes_commande[0].nom === "T-shirt d'essai", 'commande : nom de la pièce lu en base, pas celui envoyé par le navigateur', cmdA.data?.[0].lignes_commande[0].nom)
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
const horsCat = await visiteur.rpc('passer_commande', commande(`HM-HORS-${suffixe}`, [{ slug: `inexistante-${suffixe}`, nom: 'x', coloris: 'noir', taille: 'M', quantite: 1, prix_dh: 1 }]))
verdict(Boolean(horsCat.error), 'commande d\'une pièce absente du catalogue refusée (plus de prix pris au navigateur)', horsCat.error?.message)
const colorisFaux = await visiteur.rpc('passer_commande', commande(`HM-COL-${suffixe}`, [{ slug: CATALOGUE, nom: 'x', coloris: 'rose', taille: 'M', quantite: 1, prix_dh: 1 }]))
const tailleEpuisee = await visiteur.rpc('passer_commande', commande(`HM-TAI-${suffixe}`, [{ slug: CATALOGUE, nom: 'x', coloris: 'noir', taille: 'XL', quantite: 1, prix_dh: 1 }]))
verdict(Boolean(colorisFaux.error) && Boolean(tailleEpuisee.error), 'commande : coloris inconnu et taille indisponible refusés', `${colorisFaux.error?.message} / ${tailleEpuisee.error?.message}`)
{
  // Liste de villes posée le temps de l'essai, puis réglage d'origine remis
  const boutiqueAvant = psql(`select valeur::text from public.reglages where cle = 'boutique'`)
  psql(`insert into public.reglages (cle, valeur) values ('boutique', '{"livraison":{"villes":["${VILLE}"]}}') on conflict (cle) do update set valeur = jsonb_set(public.reglages.valeur, '{livraison,villes}', '["${VILLE}"]', true)`)
  const villeFausse = await visiteur.rpc('passer_commande', commande(`HM-VIL-${suffixe}`, undefined, 'Ville-non-livree'))
  psql(boutiqueAvant ? `update public.reglages set valeur = '${boutiqueAvant.replaceAll("'", "''")}' where cle = 'boutique'` : `delete from public.reglages where cle = 'boutique'`)
  verdict(Boolean(villeFausse.error) && /Ville non livrée/.test(villeFausse.error.message), 'commande : ville non livrée refusée par la base', villeFausse.error?.message)
}

// Limite par visiteur (lot A) : au-delà du maximum, passer_commande renvoie null et le blocage est noté
const maxAvant = psql(`select maximum from public.limites where action = 'commande'`)
psql(`delete from public.limites_evenements where action = 'commande'`)
psql(`update public.limites set maximum = 1 where action = 'commande'`)
const lim1 = await visiteur.rpc('passer_commande', commande(`HM-LIM1-${suffixe}`))
const lim2 = await visiteur.rpc('passer_commande', commande(`HM-LIM2-${suffixe}`))
const traceLim = psql(`select count(*) filter (where bloque) || '/' || count(*) from public.limites_evenements where action = 'commande'`)
const lim2Base = psql(`select count(*) from public.commandes where reference = 'HM-LIM2-${suffixe}'`)
psql(`update public.limites set maximum = ${Number(maxAvant) || 5} where action = 'commande'`)
psql(`delete from public.limites_evenements where action = 'commande'`)
verdict(lim1.data === `HM-LIM1-${suffixe}` && lim2.data === null && !lim2.error && lim2Base === '0' && traceLim === '1/2',
  'limite : 2ᵉ commande refusée (null), rien enregistré, blocage noté', `${lim1.data} / ${lim2.data} / ${traceLim}`)
// Plafond global (tous visiteurs) : l'en-tête d'adresse peut être falsifié, ce plafond tient quand même
const globalAvant = psql(`select coalesce(maximum_global::text, 'null') from public.limites where action = 'commande'`)
psql(`update public.limites set maximum_global = 1 where action = 'commande'`)
const glo1 = await A.sb.rpc('passer_commande', commande(`HM-GLO1-${suffixe}`))
const glo2 = await visiteur.rpc('passer_commande', commande(`HM-GLO2-${suffixe}`))
psql(`update public.limites set maximum_global = ${globalAvant} where action = 'commande'`)
psql(`delete from public.limites_evenements where action = 'commande'`)
verdict(glo1.data === `HM-GLO1-${suffixe}` && glo2.data === null, 'limite : plafond global atteint, la commande suivante est refusée', `${glo1.data} / ${glo2.data}`)
const evtV = await visiteur.from('limites_evenements').select('id')
const evtA = await A.sb.from('limites_evenements').select('id')
verdict((Boolean(evtV.error) || evtV.data?.length === 0) && evtA.data?.length === 0, 'limite : événements invisibles d\'un visiteur et d\'un client')

// ── Administration (lot 20) ─────────────────────────────────────────────────────────────────────
// Le rôle admin ne se donne qu'en SQL (jamais depuis le site) : ici par psql dans le conteneur local.
const estAdminA = await A.sb.rpc('est_admin')
const estAdminV = await visiteur.rpc('est_admin')
verdict(estAdminA.data === false && estAdminV.data === false, 'admin : un client et un visiteur ne sont pas admins')
const ESSAI = `essai-admin-${suffixe}`
const piece = { slug: ESSAI, nom: 'Pièce d\'essai admin', categorie: 't-shirts', prix_dh: 300, publie: false, images: [{ src: '/x', alt: 'essai', vue: 'face' }] }
const insA = await A.sb.from('produits').insert(piece)
const insV = await visiteur.from('produits').insert(piece)
verdict(Boolean(insA.error) && Boolean(insV.error), 'admin : un client ou un visiteur ne peut pas créer de pièce', `${insA.error?.code} / ${insV.error?.code}`)
const devenir = await A.sb.from('admins').insert({ utilisateur: A.id })
verdict(Boolean(devenir.error), 'admin : un client ne peut pas se nommer admin lui-même', devenir.error?.code)

psql(`insert into public.admins (utilisateur) values ('${B.id}') on conflict do nothing`)

// ── Clé de sécurité (lot 21) : inscrit dans `admins` ne suffit plus, la session doit être déverrouillée ──
const CLE = 'Clé libre-2026 !' // format libre : aucune règle imposée
const ancienneCle = psql('select hash from public.admin_cle where id = 1')
psql(`insert into public.admin_cle (id, hash) values (1, '${bcrypt.hashSync(CLE, 10)}') on conflict (id) do update set hash = excluded.hash`)
psql(`delete from public.admin_essais where utilisateur = '${B.id}'`)
const statutB0 = await B.sb.rpc('admin_statut')
const estAdminB0 = await B.sb.rpc('est_admin')
const insAvantCle = await B.sb.from('produits').insert({ ...piece, slug: `${ESSAI}-avant-cle` })
verdict(statutB0.data?.admin === true && statutB0.data?.cle === true && statutB0.data?.deverrouille === false && estAdminB0.data === false && Boolean(insAvantCle.error),
  'clé : compte admin connecté par mot de passe, mais sans droit tant que la clé n\'est pas saisie', JSON.stringify(statutB0.data))
const lectureCle = await B.sb.from('admin_cle').select('hash')
const lectureSessions = await B.sb.from('admin_sessions').select('session')
verdict(Boolean(lectureCle.error) && Boolean(lectureSessions.error), 'clé : empreinte et sessions illisibles depuis le site, même admin', `${lectureCle.error?.code} / ${lectureSessions.error?.code}`)
const cleClient = await A.sb.rpc('deverrouiller_admin', { cle: CLE })
verdict(cleClient.error?.code === '42501', 'clé : un client ne peut pas l\'essayer, même juste', cleClient.error?.code)
const cleFausse = await B.sb.rpc('deverrouiller_admin', { cle: '111122223333' })
verdict(cleFausse.data?.ok === false && /4 essais restants/.test(cleFausse.data?.message), 'clé : fausse refusée, essais restants annoncés', cleFausse.data?.message)
const cleJuste = await B.sb.rpc('deverrouiller_admin', { cle: CLE })
const estAdminB = await B.sb.rpc('est_admin')
verdict(cleJuste.data?.ok === true && estAdminB.data === true, 'clé : juste, la session est déverrouillée (est_admin vrai)', JSON.stringify(cleJuste.data))
const B2 = client(); await B2.auth.signInWithPassword({ email: `karim.${suffixe}@exemple.ma`, password: MDP })
const estAdminB2 = await B2.rpc('est_admin')
verdict(estAdminB2.data === false, 'clé : liée à la session, une autre connexion du même compte doit la redonner')
let derniere
for (let i = 0; i < 5; i++) derniere = await B2.rpc('deverrouiller_admin', { cle: `00000000000${i}` })
const bloquee = await B2.rpc('deverrouiller_admin', { cle: CLE })
verdict(/15 min/.test(derniere.data?.message) && bloquee.data?.ok === false && /Trop d'essais/.test(bloquee.data?.message) && (await B2.rpc('est_admin')).data === false,
  'clé : 5 erreurs de suite, bloquée 15 min (même la bonne clé est refusée)', `${derniere.data?.message} / ${bloquee.data?.message}`)
psql(`delete from public.admin_essais where utilisateur = '${B.id}'`)
await B2.auth.signOut()
const insB = await B.sb.from('produits').insert(piece)
verdict(!insB.error, 'admin : pièce créée (masquée)', insB.error?.message)
const voitV = await visiteur.from('produits').select('slug').eq('slug', ESSAI)
const voitA = await A.sb.from('produits').select('slug').eq('slug', ESSAI)
const voitB = await B.sb.from('produits').select('slug').eq('slug', ESSAI)
verdict(voitV.data?.length === 0 && voitA.data?.length === 0 && voitB.data?.length === 1, 'admin : pièce masquée invisible des clients et visiteurs, visible de l\'admin')
const cmdMasquee = await A.sb.rpc('passer_commande', commande(`HM-MASQ-${suffixe}`, [{ slug: ESSAI, nom: 'x', coloris: 'noir', taille: 'M', quantite: 1, prix_dh: 1 }]))
verdict(Boolean(cmdMasquee.error), 'commande d\'une pièce masquée refusée', cmdMasquee.error?.code)
await B.sb.from('produits').update({ publie: true }).eq('slug', ESSAI)
const voitV2 = await visiteur.from('produits').select('slug, prix_dh').eq('slug', ESSAI)
verdict(voitV2.data?.[0]?.prix_dh === 300, 'admin : pièce publiée visible du visiteur, avec son prix')
const majA = await A.sb.from('produits').update({ prix_dh: 1 }).eq('slug', ESSAI)
const prixApres = await visiteur.from('produits').select('prix_dh').eq('slug', ESSAI).maybeSingle()
verdict(prixApres.data?.prix_dh === 300, 'admin : un client ne peut pas changer un prix', majA.error?.code ?? 'aucune ligne modifiée')
const soldeFaux = await B.sb.from('produits').update({ prix_barre_dh: 200 }).eq('slug', ESSAI)
verdict(soldeFaux.error?.code === '23514', 'admin : ancien prix plus bas que le prix refusé par la base', soldeFaux.error?.code)

const refPrix = `HM-PRIX-${suffixe}`
const cmdPrix = await A.sb.rpc('passer_commande', commande(refPrix, [{ slug: ESSAI, nom: 'x', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 1 }]))
const lueP = await A.sb.from('commandes').select('sous_total_dh, lignes_commande(prix_dh)').eq('reference', refPrix).maybeSingle()
verdict(!cmdPrix.error && lueP.data?.sous_total_dh === 600 && lueP.data?.lignes_commande[0].prix_dh === 300,
  'commande : prix lu en base (300 DH), le prix envoyé par le navigateur (1 DH) est ignoré', JSON.stringify(lueP.data) + (cmdPrix.error?.message ?? ''))

const regV = await visiteur.from('reglages').upsert({ cle: 'boutique', valeur: { ville: 'Piraté' } })
const regA = await A.sb.from('reglages').upsert({ cle: 'boutique', valeur: { ville: 'Piraté' } })
verdict(Boolean(regV.error) && Boolean(regA.error), 'réglages : un visiteur ou un client ne peut rien modifier', `${regV.error?.code} / ${regA.error?.code}`)
const avantReg = await visiteur.from('reglages').select('valeur').eq('cle', 'textes').maybeSingle()
const regB = await B.sb.from('reglages').upsert({ cle: 'textes', valeur: { ...(avantReg.data?.valeur ?? {}), guideDesTailles: `Essai ${suffixe}` } })
const lueReg = await visiteur.from('reglages').select('valeur').eq('cle', 'textes').maybeSingle()
verdict(!regB.error && lueReg.data?.valeur?.guideDesTailles === `Essai ${suffixe}`, 'réglages : enregistrés par l\'admin, lus par tout visiteur', regB.error?.message)
if (avantReg.data) await B.sb.from('reglages').upsert({ cle: 'textes', valeur: avantReg.data.valeur })

const toutesB = await B.sb.from('commandes').select('reference').eq('reference', refA)
verdict(toutesB.data?.length === 1, 'commandes : l\'admin lit les commandes de tous les clients')
const statutA = await A.sb.rpc('changer_statut_commande', { ref: refA, nouveau_statut: 'livree' })
verdict(statutA.error?.code === '42501', 'commandes : un client ne peut pas changer un statut, même le sien', statutA.error?.code)
const statutB = await B.sb.rpc('changer_statut_commande', { ref: refA, nouveau_statut: 'confirmee' })
const statutLu = await A.sb.from('commandes').select('statut').eq('reference', refA).maybeSingle()
verdict(!statutB.error && statutLu.data?.statut === 'confirmee', 'commandes : statut changé par l\'admin, vu par le client', statutB.error?.message)
const statutFaux = await B.sb.rpc('changer_statut_commande', { ref: refA, nouveau_statut: 'payee' })
verdict(Boolean(statutFaux.error), 'commandes : statut inconnu refusé', statutFaux.error?.code)

const journalB = await B.sb.from('journal_admin').select('action, cible, auteur_email, details').in('cible', [ESSAI, refA, 'textes']).eq('auteur', B.id).order('id')
const actions = (journalB.data ?? []).map(j => `${j.action}:${j.cible}`)
verdict(['produit créé:' + ESSAI, 'produit modifié:' + ESSAI, 'statut de commande:' + refA, 'réglages modifiés:textes'].every(a => actions.includes(a))
  && journalB.data.every(j => j.auteur_email === `karim.${suffixe}@exemple.ma`), 'journal : création, modification, statut et réglages enregistrés avec leur auteur', actions.join(', '))
const modif = journalB.data?.find(j => j.action === 'produit modifié')
verdict(modif?.details?.publie?.avant === false && modif?.details?.publie?.apres === true, 'journal : la modification garde l\'avant et l\'après', JSON.stringify(modif?.details))
const journalA = await A.sb.from('journal_admin').select('id')
const fauxJournal = await B.sb.from('journal_admin').insert({ action: 'faux', cible: 'x' })
verdict(journalA.data?.length === 0 && Boolean(fauxJournal.error), 'journal : illisible pour un client, impossible à écrire à la main (même admin)', fauxJournal.error?.code)

const fichier = new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' })
const chemin = `${ESSAI}/essai-480.webp`
const envoiA = await A.sb.storage.from('produits').upload(chemin, fichier, { contentType: 'image/webp' })
verdict(Boolean(envoiA.error), 'photos : un client ne peut pas envoyer de photo', envoiA.error?.message)
const envoiB = await B.sb.storage.from('produits').upload(chemin, fichier, { contentType: 'image/webp' })
const publique = await fetch(B.sb.storage.from('produits').getPublicUrl(chemin).data.publicUrl)
verdict(!envoiB.error && publique.status === 200, 'photos : envoyée par l\'admin, lisible publiquement', envoiB.error?.message ?? String(publique.status))
const pdf = await B.sb.storage.from('produits').upload(`${ESSAI}/x.pdf`, new Blob(['%PDF'], { type: 'application/pdf' }), { contentType: 'application/pdf' })
verdict(Boolean(pdf.error), 'photos : seul le WebP est accepté', pdf.error?.message)
const retrait = await B.sb.storage.from('produits').remove([chemin])
verdict(!retrait.error && retrait.data?.length === 1, 'photos : retirée par l\'admin')

const supA = await A.sb.rpc('supprimer_commande', { ref: refPrix })
const supB = await B.sb.rpc('supprimer_commande', { ref: refPrix })
const reste = await B.sb.from('commandes').select('reference').eq('reference', refPrix)
verdict(supA.error?.code === '42501' && !supB.error && reste.data?.length === 0, 'commandes : suppression réservée à l\'admin', supA.error?.code)
const supP = await B.sb.from('produits').delete().eq('slug', ESSAI)
const resteP = await B.sb.from('produits').select('slug').eq('slug', ESSAI)
verdict(!supP.error && resteP.data?.length === 0, 'admin : pièce supprimée')
const journalCle = await B.sb.from('journal_admin').select('action').eq('cible', 'connexion').eq('auteur', B.id)
const actionsCle = (journalCle.data ?? []).map(j => j.action)
verdict(actionsCle.includes('connexion admin') && actionsCle.includes('clé refusée 5 fois : bloquée 15 min'), 'journal : connexion admin et blocage de la clé enregistrés', actionsCle.join(', '))
await B.sb.rpc('verrouiller_admin')
const apresVerrou = await B.sb.rpc('est_admin')
verdict(apresVerrou.data === false, 'clé : déconnexion de l\'admin, la session perd ses droits aussitôt')
await B.sb.rpc('deverrouiller_admin', { cle: CLE })

// ── Supervision (lot C) : erreurs, visites, contrôles ; rôle « technique » seulement ─────────────────
psql(`delete from public.limites_evenements where action in ('erreur_client', 'visite', 'controle_robot')`)
const errV = await visiteur.rpc('signaler_erreur', { erreur: { type: 'script', message: `Essai ${suffixe} pour ali@exemple.ma au 0612345678`, page: '/produit/x?token=secret' } })
const errTypeFaux = await visiteur.rpc('signaler_erreur', { erreur: { type: 'inconnu', message: 'x' } })
const errLue = psql(`select message || ' | ' || page from public.erreurs_site where message like 'Essai ${suffixe}%'`)
verdict(!errV.error && !errTypeFaux.error && errLue === `Essai ${suffixe} pour [e-mail] au [numéro] | /produit/x`, 'supervision : erreur envoyée par un visiteur, nettoyée (e-mail, numéro, paramètres)', errLue || errV.error?.message)
const visV = await visiteur.rpc('compter_visite', { page: `/essai-${suffixe}`, lcp_ms: 1800 })
const visAdmin = await visiteur.rpc('compter_visite', { page: '/admin/supervision' })
verdict(!visV.error && psql(`select count(*) from public.visites where page = '/essai-${suffixe}'`) === '1' && psql(`select count(*) from public.visites where page like '/admin%'`) === '0',
  'supervision : page vue comptée, administration jamais comptée', visV.error?.message ?? visAdmin.error?.message)
const statsTech = await B.sb.rpc('statistiques_supervision')
const errTech = await B.sb.from('erreurs_site').select('id').like('message', `Essai ${suffixe}%`)
verdict(!statsTech.error && statsTech.data?.visites?.trente_jours >= 1 && Array.isArray(statsTech.data?.limites?.regles) && errTech.data?.length === 1,
  'supervision : l\'admin technique lit les chiffres et les erreurs', statsTech.error?.message)
const statsA = await A.sb.rpc('statistiques_supervision')
const errA = await A.sb.from('erreurs_site').select('id')
const visA = await visiteur.from('visites').select('id')
verdict(statsA.error?.code === '42501' && errA.data?.length === 0 && (Boolean(visA.error) || visA.data?.length === 0), 'supervision : invisible d\'un client et d\'un visiteur', statsA.error?.code)
psql(`update public.admins set role = 'commerce' where utilisateur = '${B.id}'`)
const statsCommerce = await B.sb.rpc('statistiques_supervision')
const errCommerce = await B.sb.from('erreurs_site').select('id')
const prodCommerce = await B.sb.from('produits').select('slug').limit(1)
const statutCommerce = await B.sb.rpc('admin_statut')
verdict(statsCommerce.error?.code === '42501' && errCommerce.data?.length === 0 && !prodCommerce.error && statutCommerce.data?.role === 'commerce' && statutCommerce.data?.deverrouille === true,
  'rôles : « commerce » garde la boutique, sans la supervision', statsCommerce.error?.code)
psql(`update public.admins set role = 'technique' where utilisateur = '${B.id}'`)
const notes = await B.sb.rpc('noter_controles', { resultats: [{ cible: `essai ${suffixe}`, ok: true, statut_http: 200, duree_ms: 12, detail: '' }] })
const notesA = await A.sb.rpc('noter_controles', { resultats: [{ cible: 'pirate', ok: true }] })
verdict(!notes.error && notesA.error?.code === '42501' && psql(`select count(*) from public.controles_sante where cible = 'essai ${suffixe}' and source = 'admin'`) === '1', 'supervision : contrôles notés par l\'admin technique, refusés à un client', notes.error?.message)
const JETON = `jeton-robot-essai-${suffixe}-0123456789`
const jetonAvant = psql('select hash from public.robot_jeton where id = 1')
const sqlJeton = execFileSync('node', ['scripts/sante-sql.mjs'], { encoding: 'utf8', env: { PATH: process.env.PATH, SANTE_JETON: JETON } })
psql(sqlJeton.split('\n').filter(l => !l.startsWith('--')).join(' '))
const robotFaux = await visiteur.rpc('enregistrer_controles', { jeton: 'mauvais', resultats: [{ cible: 'x', ok: true }] })
const robotOk = await visiteur.rpc('enregistrer_controles', { jeton: JETON, resultats: [{ cible: `robot ${suffixe}`, ok: false, statut_http: 503, duree_ms: 40, detail: 'panne simulée' }] })
verdict(robotFaux.data?.ok === false && robotOk.data?.ok === true && robotOk.data?.alertes?.length >= 1 && !sqlJeton.includes(JETON)
  && psql(`select count(*) from public.controles_sante where cible = 'robot ${suffixe}' and source = 'robot'`) === '1',
  'robot : jeton faux refusé, bon jeton accepté, panne remontée en alerte ; le SQL ne contient que l\'empreinte', JSON.stringify(robotOk.data))
const republiAvant = psql('select coalesce(max(id), 0) from public.republications')
psql(`delete from public.republications where cree_le > now() - interval '12 hours'`)
const rep1 = await visiteur.rpc('republication_necessaire', { jeton: JETON, construit_le: '2000-01-01T00:00:00Z' })
const rep2 = await visiteur.rpc('republication_necessaire', { jeton: JETON, construit_le: '2000-01-01T00:00:00Z' })
const repFaux = await visiteur.rpc('republication_necessaire', { jeton: 'mauvais', construit_le: '2000-01-01T00:00:00Z' })
const repRecent = await visiteur.rpc('republication_necessaire', { jeton: JETON, construit_le: new Date(Date.now() + 3600e3).toISOString() })
psql(`delete from public.republications where id > ${republiAvant}`)
verdict(rep1.data === true && rep2.data === false && repFaux.data === false && repRecent.data === false,
  'robot : rebuild demandé une fois si le catalogue a changé depuis le build ; pas deux fois en 12 h ; jamais sans jeton', `${rep1.data}/${rep2.data}/${repFaux.data}/${repRecent.data}`)
psql(jetonAvant ? `update public.robot_jeton set hash = '${jetonAvant}' where id = 1` : 'delete from public.robot_jeton')
const sauv = await B.sb.from('sauvegardes').insert({ type: 'manuelle', note: `essai ${suffixe}` })
const sauvA = await A.sb.from('sauvegardes').insert({ type: 'manuelle', note: 'pirate' })
verdict(!sauv.error && Boolean(sauvA.error), 'sauvegardes : notées par l\'admin technique, refusées à un client', sauvA.error?.code)
psql(`delete from public.sauvegardes where note = 'essai ${suffixe}'; delete from public.controles_sante where cible in ('essai ${suffixe}', 'robot ${suffixe}'); delete from public.erreurs_site where message like 'Essai ${suffixe}%'; delete from public.visites where page = '/essai-${suffixe}'`)

// ── Demandes WhatsApp (lot D) : notées au clic par un visiteur, suivies par l'admin, jamais des commandes ──
psql(`delete from public.limites_evenements where action = 'demande_whatsapp'`)
const dem = await visiteur.rpc('noter_demande_whatsapp', { demande: { motif: 'renseignement', slug: CATALOGUE, coloris: 'noir', taille: 'M', nom: 'nom pirate' } })
const demInconnue = await visiteur.rpc('noter_demande_whatsapp', { demande: { motif: 'renseignement', slug: `inconnue-${suffixe}` } })
const demMotif = await visiteur.rpc('noter_demande_whatsapp', { demande: { motif: 'autre', slug: CATALOGUE } })
verdict(!dem.error && !demInconnue.error && !demMotif.error && psql(`select count(*) || '|' || max(nom_produit) || '|' || max(prix_dh) from public.demandes_whatsapp where slug = '${CATALOGUE}'`) === "1|T-shirt d'essai|450"
  && psql(`select count(*) from public.demandes_whatsapp where slug = 'inconnue-${suffixe}'`) === '0',
  'demandes : notée par un visiteur (nom et prix lus en base), pièce inconnue ou motif faux ignorés', dem.error?.message)
const demV = await visiteur.from('demandes_whatsapp').select('id')
const demA = await A.sb.from('demandes_whatsapp').select('id')
const demB = await B.sb.from('demandes_whatsapp').select('id, statut').eq('slug', CATALOGUE)
verdict((Boolean(demV.error) || demV.data?.length === 0) && demA.data?.length === 0 && demB.data?.length === 1, 'demandes : lues par l\'admin seulement')
const suivi = await B.sb.from('demandes_whatsapp').update({ statut: 'traitee', note: 'répondu' }).eq('id', demB.data?.[0]?.id)
const triche = await B.sb.from('demandes_whatsapp').update({ slug: 'autre' }).eq('id', demB.data?.[0]?.id)
const suiviA = await A.sb.from('demandes_whatsapp').update({ statut: 'sans_suite' }).eq('slug', CATALOGUE)
verdict(!suivi.error && Boolean(triche.error) && psql(`select statut from public.demandes_whatsapp where slug = '${CATALOGUE}'`) === 'traitee'
  && psql(`select count(*) from public.journal_admin where cible = 'demande ${demB.data?.[0]?.id}'`) === '1',
  'demandes : l\'admin change le suivi (journalisé), pas la pièce ; un client ne change rien', `${triche.error?.code} / ${suiviA.error?.code ?? 'aucune ligne'}`)
verdict(psql(`select count(*) from public.commandes where reference like '%${suffixe}%' and nom = 'nom pirate'`) === '0', 'demandes : aucune commande créée par une demande')
psql(`delete from public.demandes_whatsapp where slug = '${CATALOGUE}'`)

psql(`delete from public.admins where utilisateur = '${B.id}'`)
const plusAdmin = await B.sb.rpc('est_admin')
verdict(plusAdmin.data === false, 'admin : droit retiré en SQL, effet immédiat (même session déverrouillée)')

// ── Compte admin créé par `npm run admin:sql` (e-mail + mot de passe + clé lus dans .env), comme en ligne ──
const emailC = `admin.sql.${suffixe}@exemple.ma`, mdpC = `Admin-${suffixe}-77`
const sqlC = execFileSync('node', ['scripts/admin-sql.mjs'], { encoding: 'utf8', env: { PATH: process.env.PATH, ADMIN_EMAIL: emailC, ADMIN_MOT_DE_PASSE: mdpC, ADMIN_CLE: CLE } })
verdict(!sqlC.includes(mdpC) && !sqlC.includes(CLE), 'admin:sql : ni le mot de passe ni la clé en clair dans le SQL produit')
const creeC = execFileSync('docker', ['exec', '-i', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA'], { input: sqlC, encoding: 'utf8' })
const C = client()
const connC = await C.auth.signInWithPassword({ email: emailC, password: mdpC })
const cleC = await C.rpc('deverrouiller_admin', { cle: CLE })
const estAdminC = await C.rpc('est_admin')
verdict(creeC.includes(emailC) && !connC.error && cleC.data?.ok === true && estAdminC.data === true,
  'admin:sql : compte créé sans inscription, connexion par mot de passe puis clé, droits admin', connC.error?.message ?? JSON.stringify(cleC.data))
const refaitC = execFileSync('docker', ['exec', '-i', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA'], { input: sqlC.replaceAll(emailC, emailC), encoding: 'utf8' })
verdict(refaitC.includes(emailC) && psql(`select count(*) from auth.users where email = '${emailC}'`) === '1', 'admin:sql : relancé, met à jour le compte sans le dupliquer')
await C.auth.signOut()
psql(`delete from auth.users where email = '${emailC}'`)
psql(ancienneCle ? `update public.admin_cle set hash = '${ancienneCle}' where id = 1` : 'delete from public.admin_cle')

psql(`delete from public.produits where slug = '${CATALOGUE}'`)
console.log(echecs ? `\n${echecs} échec(s)` : '\nTout est vert.')
process.exit(echecs ? 1 : 0)
