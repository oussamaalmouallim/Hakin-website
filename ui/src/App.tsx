import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { transitionPage } from './lib/animations'
import { usePanier } from './state/panier'
import { useFavoris } from './state/favoris'
import { useCompte } from './state/compte'
import { EnTete } from './components/EnTete'
import { MenuMobile, MiniPanier, Recherche, useFermerSurNavigation } from './components/Panneaux'
import { PiedDePage } from './components/PiedDePage'
import { BandeauDemo, BoutonWhatsAppFlottant, ChargeurMarque, RemiseEnHaut } from './components/Ambiance'
import { PageAccueil } from './features/accueil/PageAccueil'
import { PageBoutique } from './features/catalogue/PageBoutique'
import { PageCollection, PageCollections } from './features/catalogue/PageCollections'
import { PageRecherche } from './features/catalogue/PageRecherche'
import { PageProduit } from './features/produit/PageProduit'
import { PagePanier } from './features/panier/PagePanier'
import { PageCommande } from './features/commande/PageCommande'
import { PageConfirmation } from './features/commande/PageConfirmation'
import { PageCompte } from './features/compte/PageCompte'
import { PageContact } from './features/infos/PageContact'
import { PageMaison } from './features/infos/PageMaison'
import { PageInfo } from './features/infos/PagesInfo'
import { Page404 } from './features/infos/Page404'
import { PageDesignSystem } from './features/infos/PageDesignSystem'

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
  return (
    <>
      <a href="#contenu" className="label sr-only z-[110] bg-encre px-4 py-3 text-nacre focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <ChargeurMarque />
      <RemiseEnHaut />
      <EnTete />
      <MenuMobile />
      <Recherche />
      <MiniPanier />
      <AnimatePresence mode="wait">
        <motion.main id="contenu" key={location.pathname} {...transitionPage} className="min-h-[70vh]">
          <Routes location={location}>
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
        </motion.main>
      </AnimatePresence>
      <PiedDePage />
      <BoutonWhatsAppFlottant />
      <BandeauDemo />
    </>
  )
}
