import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, FileText, History, LayoutDashboard, LogOut, Settings, Shirt, ShieldAlert } from 'lucide-react'
import { Bouton, BoutonLien, Champ, Logotype } from '@/design-system'
import { supabaseActif } from '@/lib/supabase'
import { useSession } from '@/state/session'
import { cn } from '@/lib/utils'
import { deverrouillerAdmin, statutAdmin, verrouillerAdmin, type StatutAdmin } from './api'
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
  const [statut, setStatut] = useState<StatutAdmin | 'verification' | 'erreur'>('verification')
  const [tour, setTour] = useState(0)
  useEffect(() => {
    if (!pret || !id) return
    let actif = true
    setStatut('verification')
    statutAdmin().then(s => actif && setStatut(s)).catch(() => actif && setStatut('erreur'))
    return () => { actif = false }
  }, [pret, id, tour])
  return { statut, recharger: () => setTour(t => t + 1) }
}

/** Déconnexion de l'admin : la session perd ses droits en base, puis Supabase la ferme. */
async function quitterAdmin(deconnexion: () => Promise<void>) {
  await verrouillerAdmin().catch(() => undefined)
  await deconnexion()
}

/** Garde de l'administration, en deux étapes et sans passer par l'espace client :
 *  1. e-mail + mot de passe d'un compte inscrit dans `admins` (créé dans Supabase, pas d'inscription ici) ;
 *  2. clé de sécurité de 12 chiffres, vérifiée par la base, qui déverrouille la session 12 h. */
export function PageAdmin() {
  const utilisateur = useSession(s => s.utilisateur)
  const pret = useSession(s => s.pret)
  const deconnexion = useSession(s => s.deconnexion)
  const { statut, recharger } = useStatutAdmin(utilisateur?.id, pret)
  // Connexion faite depuis ce formulaire avec un compte client : on la referme aussitôt, sans ouvrir l'espace client.
  const depuisFormulaire = useRef(false)
  const [refus, setRefus] = useState<string | null>(null)
  const nonAdmin = typeof statut === 'object' && !statut.admin
  useEffect(() => {
    if (!nonAdmin || !depuisFormulaire.current) return
    depuisFormulaire.current = false
    setRefus('Ce compte n\'a pas accès à l\'administration.')
    void deconnexion()
  }, [nonAdmin, deconnexion])

  if (!supabaseActif) return <Ecran titre="Administration indisponible" texte={<>La base de données n'est pas configurée pour ce site (fichier <code>ui/.env</code>).</>} />
  if (!pret) return <EcranChargement texte="Vérification de la session…" />
  if (!utilisateur) return <ConnexionAdmin refus={refus} onEnvoi={() => { depuisFormulaire.current = true; setRefus(null) }} />
  if (statut === 'verification' || (nonAdmin && depuisFormulaire.current)) return <EcranChargement texte="Vérification des droits…" />
  if (statut === 'erreur') return (
    <Ecran titre="Vérification impossible" texte="La base ne répond pas. Vérifiez votre connexion puis réessayez.">
      <Bouton onClick={recharger}>Réessayer</Bouton>
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
    <Ecran titre="Clé non définie" texte={<>Aucune clé de sécurité n'est enregistrée dans la base. Ajoutez <code>ADMIN_CLE</code> (12 chiffres) dans <code>ui/.env</code>, lancez <code>npm run admin:sql</code> dans <code>ui/</code> et collez le résultat dans le SQL Editor de Supabase.</>}>
      <Bouton variante="contour" onClick={() => void quitterAdmin(deconnexion)}>Se déconnecter</Bouton>
    </Ecran>
  )
  if (!statut.deverrouille) return <CleAdmin email={utilisateur.email} onOk={recharger} onQuitter={() => void quitterAdmin(deconnexion)} />
  return <CoqueAdmin email={utilisateur.email} />
}

/** Étape 1 : connexion de l'administration. Pas d'inscription ni de lien vers l'espace client.
 *  Session gardée seulement le temps de l'onglet (pas de « se souvenir de moi »). */
function ConnexionAdmin({ refus, onEnvoi }: { refus: string | null; onEnvoi: () => void }) {
  const connexion = useSession(s => s.connexion)
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreurs, setErreurs] = useState<{ email?: string; motDePasse?: string }>({})
  const [alerte, setAlerte] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Adresse e-mail invalide.', motDePasse: motDePasse ? undefined : 'Saisissez le mot de passe.' }
    setErreurs(e); setAlerte(null)
    if (e.email || e.motDePasse) return
    setEnvoi(true)
    onEnvoi()
    const r = await connexion(email, motDePasse, false)
    setEnvoi(false)
    if (r.erreur) setAlerte(r.erreur)
  }
  const message = alerte ?? refus
  return (
    <Ecran titre="Connexion administrateur" icone={false} texte="Réservée à l'équipe H MODE. Les comptes administrateur sont créés par la boutique.">
      <form onSubmit={envoyer} noValidate aria-label="Connexion administrateur" className="flex flex-col gap-5">
        {message && <p role="alert" className="rounded-[10px] border border-danger bg-blanc px-4 py-3 text-[14px] text-danger">{message}</p>}
        <Champ label="Adresse e-mail" type="email" autoComplete="username" value={email} erreur={erreurs.email}
          onChange={e => { setEmail(e.target.value); setErreurs(x => ({ ...x, email: undefined })) }} />
        <Champ label="Mot de passe" type="password" autoComplete="current-password" value={motDePasse} erreur={erreurs.motDePasse}
          onChange={e => { setMotDePasse(e.target.value); setErreurs(x => ({ ...x, motDePasse: undefined })) }} />
        <Bouton type="submit" chargement={envoi} plein_largeur>Se connecter</Bouton>
      </form>
    </Ecran>
  )
}

/** Étape 2 : clé de sécurité de 12 chiffres, comparée par la base à son empreinte. */
function CleAdmin({ email, onOk, onQuitter }: { email: string; onOk: () => void; onQuitter: () => void }) {
  const [cle, setCle] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    if (cle.length !== 12) { setErreur('La clé fait 12 chiffres.'); return }
    setEnvoi(true); setErreur(null)
    try {
      const r = await deverrouillerAdmin(cle)
      if (r.ok) { onOk(); return }
      setErreur(r.message ?? 'Clé incorrecte.'); setCle('')
    } catch (e) { setErreur((e as Error).message) }
    finally { setEnvoi(false) }
  }
  return (
    <Ecran titre="Clé de sécurité" icone={false} texte={<>Connecté : <strong className="text-encre">{email}</strong>. Saisissez la clé de 12 chiffres de l'administration.</>}>
      <form onSubmit={envoyer} noValidate aria-label="Clé de sécurité" className="flex flex-col gap-5">
        <Champ label="Clé (12 chiffres)" type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={12} autoFocus
          value={cle} erreur={erreur ?? undefined} aide={`${cle.length} / 12`}
          onChange={e => { setCle(e.target.value.replace(/\D/g, '').slice(0, 12)); setErreur(null) }} />
        <Bouton type="submit" chargement={envoi} plein_largeur>Déverrouiller</Bouton>
        <button type="button" onClick={onQuitter} className="label mx-auto text-encre underline underline-offset-4">Se déconnecter</button>
      </form>
    </Ecran>
  )
}

function CoqueAdmin({ email }: { email: string }) {
  const deconnexion = useSession(s => s.deconnexion)
  const naviguer = useNavigate()
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
        <Routes>
          <Route index element={<TableauDeBord />} />
          <Route path="produits" element={<ListeProduits />} />
          <Route path="produits/nouveau" element={<EditionProduit />} />
          <Route path="produits/:slug" element={<EditionProduit />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="reglages" element={<Reglages />} />
          <Route path="textes" element={<Textes />} />
          <Route path="journal" element={<Journal />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}
