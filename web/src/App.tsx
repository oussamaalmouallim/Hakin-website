import { Suspense, lazy, useEffect, type ComponentType } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { transitionPage } from './lib/animations'
import { usePanier } from './state/panier'
import { useFavoris } from './state/favoris'
import { useCompte } from './state/compte'
import { EnTete } from './components/EnTete'
import { MenuMobile, MiniPanier, Recherche, useFermerSurNavigation } from './components/Panneaux'
import { PiedDePage } from './components/PiedDePage'
import { BoutonWhatsAppFlottant, ChargeurMarque, RepereLateral } from './components/Ambiance'
import { PageAccueil } from './features/accueil/PageAccueil'
import { PageBoutique } from './features/catalogue/PageBoutique'
import { PageProduit } from './features/produit/PageProduit'
import { useSession } from './state/session'
import { brancherSynchroCompte } from './state/synchroCompte'
import { chargerDonnees, useDonnees } from './lib/donnees'

/** Chargement par page. Accueil, boutique et fiche produit restent dans le paquet principal : ce sont les pages
 *  d'arrivée (liens Insta, FB, WhatsApp), leur première image ne doit pas attendre un second fichier (mesuré : LCP mobile
 *  +0,7 s et décalage 0,26 sinon). Chaque autre page devient un fichier à part, préchargé quand le navigateur est libre. */
const pages = {
  collections: () => import('./features/catalogue/PageCollections'),
  recherche: () => import('./features/catalogue/PageRecherche'),
  panier: () => import('./features/panier/PagePanier'),
  commande: () => import('./features/commande/PageCommande'),
  confirmation: () => import('./features/commande/PageConfirmation'),
  compte: () => import('./features/compte/PageCompte'),
  connexion: () => import('./features/compte/PageConnexion'),
  contact: () => import('./features/infos/PageContact'),
  maison: () => import('./features/infos/PageMaison'),
  info: () => import('./features/infos/PagesInfo'),
  introuvable: () => import('./features/infos/Page404'),
  admin: () => import('./features/admin/PageAdmin'),
  designSystem: () => import('./features/infos/PageDesignSystem'),
}
// Les pages exportent des fonctions nommées : on garde leur type (et donc leurs props) pour `lazy`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const differee = <M, K extends keyof M>(charger: () => Promise<M>, nom: K) =>
  lazy(async () => ({ default: (await charger())[nom] as M[K] & ComponentType<any> }))

const PageCollections = differee(pages.collections, 'PageCollections')
const PageCollection = differee(pages.collections, 'PageCollection')
const PageRecherche = differee(pages.recherche, 'PageRecherche')
const PagePanier = differee(pages.panier, 'PagePanier')
const PageCommande = differee(pages.commande, 'PageCommande')
const PageConfirmation = differee(pages.confirmation, 'PageConfirmation')
const PageCompte = differee(pages.compte, 'PageCompte')
const PageConnexion = differee(pages.connexion, 'PageConnexion')
const PageContact = differee(pages.contact, 'PageContact')
const PageMaison = differee(pages.maison, 'PageMaison')
const PageInfo = differee(pages.info, 'PageInfo')
const Page404 = differee(pages.introuvable, 'Page404')
const PageDesignSystem = differee(pages.designSystem, 'PageDesignSystem')
const PageAdmin = differee(pages.admin, 'PageAdmin')

/** Précharge toutes les pages une fois la première affichée : la navigation suivante reste instantanée. */
function usePrechargementPages() {
  useEffect(() => {
    // L'administration n'est pas préchargée : seuls les admins l'ouvrent.
    const lancer = () => Object.entries(pages).forEach(([nom, charger]) => { if (nom !== 'admin') void charger() })
    const w = window as Window & { requestIdleCallback?: (f: () => void) => number }
    if (w.requestIdleCallback) w.requestIdleCallback(lancer)
    else window.setTimeout(lancer, 1500)
  }, [])
}

const PAGES_FORMULAIRE = /^\/(commande|connexion|compte|contact)(\/|$)/

/** Synchronise panier, favoris et compte entre onglets. */
function useSynchroOnglets() {
  useEffect(() => {
    const f = (e: StorageEvent) => {
      if (e.key === 'hmode-panier') usePanier.persist.rehydrate()
      if (e.key === 'hmode-favoris') useFavoris.persist.rehydrate()
      if (e.key === 'hmode-compte') useCompte.persist.rehydrate()
    }
    window.addEventListener('storage', f)
    return () => window.removeEventListener('storage', f)
  }, [])
}

export default function App() {
  const location = useLocation()
  useFermerSurNavigation()
  useSynchroOnglets()
  usePrechargementPages()
  const demarrerSession = useSession(s => s.demarrer)
  useEffect(() => { void demarrerSession() }, [demarrerSession])
  useEffect(() => brancherSynchroCompte(), [])
  // Catalogue et réglages de la base (lot 20) ; en attendant, ceux livrés avec le site.
  useEffect(() => { void chargerDonnees() }, [])
  const versionDonnees = useDonnees(s => s.version)
  // Page de connexion plein écran comme la référence : ni en-tête, ni pied, ni repère latéral.
  const pleinEcran = location.pathname.startsWith('/connexion')
  // Administration : application à part (sa propre coque), hors des transitions de page du site
  // (un ancêtre transformé casserait ses barres fixées en bas).
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return <Suspense fallback={<div className="min-h-screen bg-fond" aria-busy="true" />}><Routes><Route path="/admin/*" element={<PageAdmin />} /></Routes></Suspense>
  }
  return (
    <>
      <a href="#contenu" className="label sr-only z-[110] bg-encre px-4 py-3 text-nacre focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <ChargeurMarque />
      {!pleinEcran && <EnTete />}
      <MenuMobile />
      <Recherche />
      <MiniPanier />
      {!pleinEcran && <RepereLateral />}
      {/* Remise en haut une fois l'ancienne page sortie : pas de saut visible pendant la transition. */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })}>
        {/* /boutique et /boutique/<type> partagent la même clé : filtrer par type ne rejoue pas la transition de page. */}
        <motion.main id="contenu" key={location.pathname.startsWith('/boutique') ? '/boutique' : location.pathname} {...transitionPage} className={pleinEcran ? undefined : 'min-h-[70vh]'}>
          {/* Attente plein écran : le pied reste sous la ligne de flottaison, aucun décalage visible. */}
          <Suspense fallback={<div className="min-h-[100svh]" aria-busy="true" />}>
          {/* Nouvelle version du catalogue (base) : les pages du catalogue repartent avec les données à jour.
              Les pages à formulaire gardent leur saisie (simple réaffichage) : un réseau lent ne doit rien effacer. */}
          <Routes location={location} key={PAGES_FORMULAIRE.test(location.pathname) ? 'formulaire' : versionDonnees}>
            <Route path="/" element={<PageAccueil />} />
            <Route path="/boutique" element={<PageBoutique />} />
            <Route path="/boutique/:categorie" element={<PageBoutique />} />
            <Route path="/collections" element={<PageCollections />} />
            <Route path="/collections/:slug" element={<PageCollection />} />
            <Route path="/recherche" element={<PageRecherche />} />
            <Route path="/produit/:slug" element={<PageProduit />} />
            <Route path="/panier" element={<PagePanier />} />
            <Route path="/commande" element={<PageCommande />} />
            <Route path="/commande/confirmation" element={<PageConfirmation />} />
            <Route path="/compte/*" element={<PageCompte />} />
            <Route path="/connexion" element={<PageConnexion />} />
            <Route path="/connexion/nouveau-mot-de-passe" element={<PageConnexion recuperation />} />
            <Route path="/contact" element={<PageContact />} />
            <Route path="/maison" element={<PageMaison />} />
            <Route path="/livraison-retours" element={<PageInfo page="livraison-retours" />} />
            <Route path="/faq" element={<PageInfo page="faq" />} />
            <Route path="/guide-des-tailles" element={<PageInfo page="guide-des-tailles" />} />
            <Route path="/mentions-legales" element={<PageInfo page="mentions-legales" />} />
            <Route path="/confidentialite" element={<PageInfo page="confidentialite" />} />
            <Route path="/cgv" element={<PageInfo page="cgv" />} />
            <Route path="/design-system" element={<PageDesignSystem />} />
            <Route path="*" element={<Page404 />} />
          </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      {!pleinEcran && <PiedDePage />}
      {!pleinEcran && <BoutonWhatsAppFlottant />}
    </>
  )
}
