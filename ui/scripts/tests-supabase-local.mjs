// Tests de bout en bout sur le Supabase LOCAL (Docker, `npx supabase start`), jamais sur le projet en ligne.
// Vérifie avec de vrais comptes : inscription + confirmation d'e-mail, profil, panier, adresses, commandes,
// et surtout l'isolation (RLS) entre deux clients et vis-à-vis d'un visiteur.
// Usage : cd ui && node --env-file=.env.supabase-local scripts/tests-supabase-local.mjs
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'

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
// Pièce absente de la table `produits` : le prix envoyé est gardé (catalogue pas encore importé). Le prix lu en base est testé plus bas.
const HORS_CATALOGUE = `essai-hors-catalogue-${suffixe}`
const commande = (reference, lignes = [{ slug: HORS_CATALOGUE, nom: 'T-shirt logo Dior', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 450 }]) => ({ commande: {
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

// ── Administration (lot 20) ─────────────────────────────────────────────────────────────────────
// Le rôle admin ne se donne qu'en SQL (jamais depuis le site) : ici par psql dans le conteneur local.
const psql = sql => execFileSync('docker', ['exec', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', sql], { encoding: 'utf8' }).trim()
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
const estAdminB = await B.sb.rpc('est_admin')
verdict(estAdminB.data === true, 'admin : compte nommé en SQL reconnu par est_admin()')
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
psql(`delete from public.admins where utilisateur = '${B.id}'`)
const plusAdmin = await B.sb.rpc('est_admin')
verdict(plusAdmin.data === false, 'admin : droit retiré en SQL, effet immédiat')

console.log(echecs ? `\n${echecs} échec(s)` : '\nTout est vert.')
process.exit(echecs ? 1 : 0)
