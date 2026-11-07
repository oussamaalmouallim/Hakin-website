import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, FileText, History, LayoutDashboard, LogOut, Settings, Shirt, ShieldAlert } from 'lucide-react'
import { Bouton, BoutonLien, Champ, Logotype, useNotifier } from '@/design-system'
import { produitsFichier } from '@/lib/catalogue'
import { chargerDonnees } from '@/lib/donnees'
import { supabaseActif } from '@/lib/supabase'
import { useSession } from '@/state/session'
import { cn } from '@/lib/utils'
import { ErreurBase, deverrouillerAdmin, importInitialNecessaire, importerCatalogue, sessionRefusee, statutAdmin, verrouillerAdmin, type StatutAdmin } from './api'
import { Chargement } from './commun'
import { TableauDeBord } from './TableauDeBord'
import { ListeProduits } from './ListeProduits'
import { EditionProduit } from './EditionProduit'
import { Commandes } from './Commandes'
import { Reglages } from './Reglages'
import { Textes } from './Textes'
import { Journal } from './Journal'

export const ONGLETS_ADMIN = [
  { vers: '/admin', libelle: 'Tableau de bord', Icone: LayoutDashboard, fin: true },
  { vers: '/admin/produits', libelle: 'Produits et prix', Icone: Shirt },
  { vers: '/admin/commandes', libelle: 'Commandes', Icone: ClipboardList },
  { vers: '/admin/reglages', libelle: 'Réglages', Icone: Settings },
  { vers: '/admin/textes', libelle: 'Textes', Icone: FileText },
  { vers: '/admin/journal', libelle: 'Journal', Icone: History },
]

/** Écran plein de l'administration, hors de la coque du site : connexion, clé, accès refusé. */
function Ecran({ titre, texte, icone = true, children }: { titre: string; texte?: ReactNode; icone?: boolean; children?: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-fond px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-10 flex w-fit"><Logotype sousTitre="Administration" /><span className="sr-only"> — accueil du site</span></Link>
        <div className="rounded-carte bg-fond-2 p-6 md:p-8">
          {icone && <ShieldAlert className="mb-5 h-7 w-7 text-gris" strokeWidth={1.25} aria-hidden />}
          <h1 className="font-display text-[26px] uppercase leading-[1.05]">{titre}</h1>
          {texte && <div className="mt-3 text-[14px] leading-[1.6] text-gris">{texte}</div>}
          {children && <div className="mt-7">{children}</div>}
        </div>
      </div>
    </div>
  )
}
const EcranChargement = ({ texte }: { texte: string }) => <div className="grid min-h-screen place-items-center bg-fond"><Chargement texte={texte} /></div>

/** État du compte connecté vis-à-vis de l'administration, lu dans la base (`admin_statut()`, lot-21-admin-cle.sql).
 *  Dépend de l'identifiant, pas de l'objet : un rafraîchissement de session ne doit ni revérifier ni démonter les écrans. */
function useStatutAdmin(id: string | undefined, pret: boolean) {
  const [statut, setStatut] = useState<StatutAdmin | 'verification' | 'erreur' | 'session-refusee'>('verification')
  const [detail, setDetail] = useState('')
  const [tour, setTour] = useState(0)
  useEffect(() => {
    if (!pret || !id) return
    let actif = true
    setStatut('verification')
    statutAdmin().then(s => actif && setStatut(s)).catch(e => {
      if (!actif) return
      console.error('[admin] vérification des droits :', e)
      setDetail(e instanceof ErreurBase ? [e.code, e.detail].filter(Boolean).join(' — ') : String((e as Error)?.message ?? e))
      setStatut(sessionRefusee(e) ? 'session-refusee' : 'erreur')
    })
    return () => { actif = false }
  }, [pret, id, tour])
  return { statut, detail, recharger: () => setTour(t => t + 1) }
}

/** Déconnexion de l'admin : la session perd ses droits en base, puis Supabase la ferme. */
async function quitterAdmin(deconnexion: () => Promise<void>) {
  await verrouillerAdmin().catch(() => undefined)
  await deconnexion()
}

/** Garde de l'administration : un seul formulaire, trois champs — e-mail, mot de passe, clé de sécurité.
 *  Le compte admin est créé par `npm run admin:sql` (lu dans ui/.env), jamais par l'inscription du site.
 *  Mot de passe vérifié par Supabase, clé vérifiée par la base (`deverrouiller_admin`, session ouverte 12 h). */
export function PageAdmin() {
  const utilisateur = useSession(s => s.utilisateur)
  const pret = useSession(s => s.pret)
  const deconnexion = useSession(s => s.deconnexion)
  const { statut, detail, recharger } = useStatutAdmin(utilisateur?.id, pret)
  // Pendant l'envoi du formulaire, il reste affiché (la connexion change la session avant que la clé soit vérifiée).
  const [envoi, setEnvoi] = useState(false)
  // Session gardée par le navigateur mais refusée par la base (expirée, ancienne, autre projet) : on la referme,
  // et le formulaire le dit.
  const [sessionFermee, setSessionFermee] = useState(false)
  useEffect(() => {
    if (statut !== 'session-refusee') return
    setSessionFermee(true)
    void quitterAdmin(deconnexion)
  }, [statut, deconnexion])

  if (!supabaseActif) return <Ecran titre="Administration indisponible" texte={<>La base de données n'est pas configurée pour ce site (fichier <code>ui/.env</code>).</>} />
  if (!pret) return <EcranChargement texte="Vérification de la session…" />
  const aDeverrouiller = typeof statut === 'object' && statut.admin && statut.cle && !statut.deverrouille
  if (!utilisateur || envoi || aDeverrouiller) return (
    <ConnexionAdmin emailConnu={aDeverrouiller ? utilisateur?.email : undefined} onEnvoi={v => { setEnvoi(v); if (v) setSessionFermee(false) }} onOk={recharger}
      avis={sessionFermee ? 'Votre session n\'était plus valable. Reconnectez-vous.' : undefined} />
  )
  if (statut === 'verification' || statut === 'session-refusee') return <EcranChargement texte="Vérification des droits…" />
  if (statut === 'erreur') return (
    <Ecran titre="Vérification impossible" texte="La base a répondu par une erreur. Réessayez ; si ça continue, déconnectez-vous puis reconnectez-vous.">
      {detail && <p className="mb-5 break-words rounded-[10px] border border-ligne-forte bg-blanc px-4 py-3 font-mono text-[12px] text-encre">Détail : {detail}</p>}
      <div className="flex flex-wrap gap-3">
        <Bouton onClick={recharger}>Réessayer</Bouton>
        <Bouton variante="contour" onClick={() => void quitterAdmin(deconnexion)}>Se déconnecter</Bouton>
      </div>
    </Ecran>
  )
  if (!statut.admin) return (
    <Ecran titre="Accès réservé" texte={<>Vous êtes connecté avec le compte client <strong className="text-encre">{utilisateur.email}</strong>, qui n'a pas accès à l'administration.</>}>
      <div className="flex flex-wrap gap-3">
        <Bouton onClick={() => void deconnexion()}>Changer de compte</Bouton>
        <BoutonLien to="/" variante="contour">Retour au site</BoutonLien>
      </div>
    </Ecran>
  )
  if (!statut.cle) return (
    <Ecran titre="Clé non définie" texte={<>Aucune clé de sécurité n'est enregistrée dans la base. Renseignez <code>ADMIN_EMAIL</code>, <code>ADMIN_MOT_DE_PASSE</code> et <code>ADMIN_CLE</code> dans <code>ui/.env</code>, lancez <code>npm run admin:sql</code> dans <code>ui/</code> et collez le résultat dans le SQL Editor de Supabase.</>}>
      <Bouton variante="contour" onClick={() => void quitterAdmin(deconnexion)}>Se déconnecter</Bouton>
    </Ecran>
  )
  return <CoqueAdmin email={utilisateur.email} />
}

/** Connexion de l'administration : e-mail, mot de passe et clé de sécurité, sur un seul écran.
 *  Pas d'inscription ni de lien vers l'espace client ; session gardée seulement le temps de l'onglet.
 *  Un refus (compte client, clé fausse) referme aussitôt la session ouverte par le mot de passe. */
function ConnexionAdmin({ emailConnu, onEnvoi, onOk, avis }: { emailConnu?: string; onEnvoi: (v: boolean) => void; onOk: () => void; avis?: string }) {
  const connexion = useSession(s => s.connexion)
  const deconnexion = useSession(s => s.deconnexion)
  const [f, setF] = useState({ email: emailConnu ?? '', motDePasse: '', cle: '' })
  const [erreurs, setErreurs] = useState<Partial<Record<keyof typeof f, string>>>({})
  const [alerte, setAlerte] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const maj = (k: keyof typeof f, v: string) => { setF(x => ({ ...x, [k]: v })); setErreurs(x => ({ ...x, [k]: undefined })) }
  const refuser = async (message: string) => { await quitterAdmin(deconnexion); setAlerte(message); setF(x => ({ ...x, motDePasse: '', cle: '' })) }

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? undefined : 'Adresse e-mail invalide.',
      motDePasse: f.motDePasse ? undefined : 'Saisissez le mot de passe.',
      cle: f.cle ? undefined : 'Saisissez la clé de sécurité.',
    }
    setErreurs(e); setAlerte(null)
    if (e.email || e.motDePasse || e.cle) return
    setEnvoi(true); onEnvoi(true)
    let ok = false
    try {
      const r = await connexion(f.email, f.motDePasse, false)
      if (r.erreur) { setAlerte(r.erreur); return }
      const s = await statutAdmin()
      if (!s.admin) { await refuser('Ce compte n\'a pas accès à l\'administration.'); return }
      if (!s.cle) { ok = true; return } // la page explique comment poser la clé
      const d = await deverrouillerAdmin(f.cle)
      if (!d.ok) { await refuser(d.message ?? 'Clé incorrecte.'); return }
      ok = true
    } catch (err) {
      await refuser((err as Error).message)
    } finally {
      setEnvoi(false); onEnvoi(false)
      if (ok) onOk()
    }
  }

  return (
    <Ecran titre="Connexion administrateur" icone={false} texte={emailConnu
      ? 'Votre session d\'administration a expiré. Saisissez de nouveau votre mot de passe et votre clé.'
      : 'Réservée à l\'équipe H MODE. Le compte administrateur est créé par la boutique.'}>
      <form onSubmit={envoyer} noValidate aria-label="Connexion administrateur" className="flex flex-col gap-5">
        {(alerte ?? avis) && <p role="alert" className="rounded-[10px] border border-danger bg-blanc px-4 py-3 text-[14px] text-danger">{alerte ?? avis}</p>}
        <Champ label="Adresse e-mail" type="email" autoComplete="username" value={f.email} erreur={erreurs.email} onChange={e => maj('email', e.target.value)} />
        <Champ label="Mot de passe" type="password" autoComplete="current-password" value={f.motDePasse} erreur={erreurs.motDePasse} onChange={e => maj('motDePasse', e.target.value)} />
        <Champ label="Clé de sécurité" type="password" autoComplete="off" value={f.cle} erreur={erreurs.cle} onChange={e => maj('cle', e.target.value)} />
        <Bouton type="submit" chargement={envoi} plein_largeur>Se connecter</Bouton>
      </form>
    </Ecran>
  )
}

/** Première entrée dans l'admin : le catalogue actuel du site est importé en base tout seul (une seule fois).
 *  Une seule exécution à la fois (le double montage du mode strict ne lance pas deux imports). */
let importInitial: Promise<number> | null = null
const lancerImportInitial = () => (importInitial ??= (async () => {
  try { return (await importInitialNecessaire()) ? await importerCatalogue(produitsFichier()) : 0 }
  finally { importInitial = null }
})())

function useImportInitial() {
  const notifier = useNotifier()
  const [pret, setPret] = useState(false)
  useEffect(() => {
    let actif = true
    ;(async () => {
      try {
        const n = await lancerImportInitial()
        if (n) {
          await chargerDonnees()
          if (actif) notifier({ ton: 'succes', message: `Catalogue actuel importé automatiquement : ${n} pièces.` })
        }
      } catch (e) {
        if (actif) notifier({ ton: 'erreur', message: `Import automatique impossible : ${(e as Error).message}. Utilisez « Importer » sur le tableau de bord.` })
      } finally { if (actif) setPret(true) }
    })()
    return () => { actif = false }
  }, [notifier])
  return pret
}

function CoqueAdmin({ email }: { email: string }) {
  const deconnexion = useSession(s => s.deconnexion)
  const naviguer = useNavigate()
  const catalogue = useImportInitial()
  const lien = ({ isActive }: { isActive: boolean }) => cn('flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors lg:rounded-[10px]',
    isActive ? 'bg-accent text-encre' : 'text-fond/70 hover:bg-fond/10 hover:text-fond')
  return (
    <div className="min-h-screen bg-fond lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#contenu-admin" className="label sr-only z-[110] bg-encre px-4 py-3 text-fond focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <aside className="bg-encre text-fond lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:px-6 lg:py-7">
          <Link to="/admin" className="flex items-center"><Logotype clair sousTitre="Administration" /><span className="sr-only"> — tableau de bord</span></Link>
        </div>
        <nav aria-label="Administration" className="defilement-masque flex gap-1 overflow-x-auto overscroll-x-contain px-3 pb-4 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
          {ONGLETS_ADMIN.map(({ vers, libelle, Icone, fin }) => (
            <NavLink key={vers} to={vers} end={fin} className={lien}><Icone className="h-4 w-4" strokeWidth={1.5} aria-hidden />{libelle}</NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-fond/10 px-6 py-5 lg:block">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-fond/60" title={email}>{email}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fond/80 hover:text-fond"><ArrowUpRight className="h-4 w-4" aria-hidden />Voir le site</Link>
            <button type="button" onClick={async () => { await quitterAdmin(deconnexion); naviguer('/') }} className="flex items-center gap-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-fond/80 hover:text-fond">
              <LogOut className="h-4 w-4" aria-hidden />Se déconnecter
            </button>
          </div>
        </div>
      </aside>
      <main id="contenu-admin" className="min-w-0 px-5 py-8 md:px-10 lg:px-14 lg:py-12">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-gris">{email}</p>
          <div className="flex shrink-0 gap-4">
            <Link to="/" className="label text-encre underline underline-offset-4">Site</Link>
            <button type="button" onClick={async () => { await quitterAdmin(deconnexion); naviguer('/') }} className="label text-encre underline underline-offset-4">Déconnexion</button>
          </div>
        </div>
        {!catalogue ? <Chargement texte="Préparation du catalogue…" /> : <Routes>
          <Route index element={<TableauDeBord />} />
          <Route path="produits" element={<ListeProduits />} />
          <Route path="produits/nouveau" element={<EditionProduit />} />
          <Route path="produits/:slug" element={<EditionProduit />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="reglages" element={<Reglages />} />
          <Route path="textes" element={<Textes />} />
          <Route path="journal" element={<Journal />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>}
      </main>
    </div>
  )
}
