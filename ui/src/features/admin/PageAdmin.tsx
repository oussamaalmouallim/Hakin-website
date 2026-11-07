import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, FileText, History, LayoutDashboard, LogOut, Settings, Shirt, ShieldAlert } from 'lucide-react'
import { BoutonLien, Logotype } from '@/design-system'
import { supabaseActif } from '@/lib/supabase'
import { useSession } from '@/state/session'
import { cn } from '@/lib/utils'
import { estAdmin } from './api'
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

/** Écran plein, sans l'en-tête du site, pour les cas où l'administration n'est pas accessible. */
function Ecran({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-fond px-5 py-16">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mx-auto mb-10 flex w-fit"><Logotype /><span className="sr-only"> — accueil</span></Link>
        <ShieldAlert className="mx-auto mb-5 h-8 w-8 text-gris" strokeWidth={1.25} aria-hidden />
        <h1 className="font-display text-[26px] uppercase leading-[1.05]">{titre}</h1>
        <div className="mt-4 text-[14px] leading-[1.6] text-gris">{children}</div>
      </div>
    </div>
  )
}

/** Garde de l'administration : compte connecté ET inscrit dans `admins` (vérifié par la base, `est_admin()`). */
function useAccesAdmin() {
  const utilisateur = useSession(s => s.utilisateur)
  const pret = useSession(s => s.pret)
  const [acces, setAcces] = useState<'verification' | 'admin' | 'refuse' | 'erreur'>('verification')
  // Dépend de l'identifiant, pas de l'objet : un simple rafraîchissement de session (toutes les heures) recrée l'objet
  // et ne doit ni revérifier ni démonter les écrans (une saisie en cours serait perdue).
  const id = utilisateur?.id
  useEffect(() => {
    if (!pret || !id) return
    let actif = true
    setAcces('verification')
    estAdmin().then(ok => actif && setAcces(ok ? 'admin' : 'refuse')).catch(() => actif && setAcces('erreur'))
    return () => { actif = false }
  }, [pret, id])
  return { utilisateur, pret, acces }
}

export function PageAdmin() {
  const { utilisateur, pret, acces } = useAccesAdmin()
  const { pathname } = useLocation()
  if (!supabaseActif) return <Ecran titre="Administration indisponible">La base de données n'est pas configurée pour ce site (fichier <code>ui/.env</code>).</Ecran>
  if (!pret) return <div className="grid min-h-screen place-items-center bg-fond"><Chargement texte="Vérification de la session…" /></div>
  if (!utilisateur) return <Navigate to={`/connexion?retour=${encodeURIComponent(pathname)}`} replace />
  if (acces === 'verification') return <div className="grid min-h-screen place-items-center bg-fond"><Chargement texte="Vérification des droits…" /></div>
  if (acces === 'erreur') return <Ecran titre="Vérification impossible">La base ne répond pas. Vérifiez votre connexion puis rechargez la page.</Ecran>
  if (acces === 'refuse') return (
    <Ecran titre="Accès réservé">
      <p>Le compte <strong className="text-encre">{utilisateur.email}</strong> n'a pas les droits d'administration.</p>
      <div className="mt-8 flex justify-center gap-3"><BoutonLien to="/" variante="contour">Retour au site</BoutonLien></div>
    </Ecran>
  )
  return <CoqueAdmin email={utilisateur.email} />
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
            <button type="button" onClick={async () => { await deconnexion(); naviguer('/') }} className="flex items-center gap-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-fond/80 hover:text-fond">
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
            <button type="button" onClick={async () => { await deconnexion(); naviguer('/') }} className="label text-encre underline underline-offset-4">Déconnexion</button>
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
