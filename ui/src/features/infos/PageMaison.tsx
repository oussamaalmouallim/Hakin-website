import { BoutonLien, Cadre, Monogramme, Revelation, Signature } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { boutique } from '@/lib/catalogue'

/** Récit de marque : textes définitifs à fournir (plan.md, Lot 11). Rien d'inventé : seuls les faits connus sont affichés. */
export function PageMaison() {
  return (
    <>
      <EnTetePage surtitre="La Maison" titre="Le casual, une autre élégance." ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'La Maison' }]} />
      <section className="conteneur grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <Cadre className="aspect-[4/5]"><img src="/images/campagne/hero-modele-640.webp" srcSet="/images/campagne/hero-modele-640.webp 640w, /images/campagne/hero-modele-1280.webp 1060w" sizes="(min-width: 1024px) 40vw, 100vw" alt="Homme en veste en jean et sweat à capuche écru, lunettes de soleil" className="absolute inset-0 h-full w-full object-cover object-top" /></Cadre>
        <Revelation className="flex flex-col gap-6 text-[17px] text-gris">
          <Monogramme className="h-14" />
          <p>H MODE est une boutique de vêtements premium pour homme, à {boutique.ville}.</p>
          <p>Revendeur agréé des maisons présentées, nous sélectionnons chaque pièce et vous conseillons personnellement, de la taille au coloris.</p>
          <p>Vos commandes se font simplement sur WhatsApp, avec le {boutique.paiement.toLowerCase()}.</p>
          <BoutonLien to="/boutique" className="mt-4 self-start">Découvrir la boutique</BoutonLien>
        </Revelation>
      </section>
      <Signature className="mt-28" />
    </>
  )
}
