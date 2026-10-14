import type { ReactNode } from 'react'
import { Accordeon, AConfirmer, BoutonExterne, IconeWhatsApp, Revelation } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { boutique } from '@/lib/catalogue'
import { lienWhatsApp } from '@/lib/whatsapp'

type Cle = 'livraison-retours' | 'faq' | 'guide-des-tailles' | 'mentions-legales' | 'confidentialite' | 'cgv'
const A = () => <AConfirmer>À confirmer par la boutique</AConfirmer>

/** Pages d'information : structure prête, contenus commerciaux et juridiques à fournir (plan.md, décision D9). */
const PAGES: Record<Cle, { surtitre: string; titre: string; intro?: string; contenu: ReactNode }> = {
  'livraison-retours': {
    surtitre: 'Aide', titre: 'Livraison & retours', intro: 'Chaque commande est confirmée avec vous sur WhatsApp avant expédition.',
    contenu: <>
      <Accordeon titre="Paiement" ouvertParDefaut>{boutique.paiement}.</Accordeon>
      <Accordeon titre="Zones de livraison">{boutique.livraison.zones ?? <A />}</Accordeon>
      <Accordeon titre="Délais">{boutique.livraison.delai ?? <A />}</Accordeon>
      <Accordeon titre="Frais de livraison">{boutique.livraison.fraisDH != null ? `${boutique.livraison.fraisDH} DH` : <A />}</Accordeon>
      <Accordeon titre="Échanges et retours">{boutique.retours ?? <A />}</Accordeon>
    </>,
  },
  faq: {
    surtitre: 'Aide', titre: 'Questions fréquentes',
    contenu: <>
      <Accordeon titre="Comment passer commande ?" ouvertParDefaut>Ajoutez vos pièces au panier puis finalisez la commande : WhatsApp s'ouvre avec le récapitulatif pré-rempli. Vous pouvez aussi nous écrire directement depuis chaque fiche produit.</Accordeon>
      <Accordeon titre="Comment payer ?">{boutique.paiement}.</Accordeon>
      <Accordeon titre="Les prix ne sont pas affichés, pourquoi ?">Les prix sont en cours de mise en ligne. En attendant, demandez-les sur WhatsApp depuis la fiche produit.</Accordeon>
      <Accordeon titre="Mon compte est-il enregistré en ligne ?">Non : votre compte est conservé dans ce navigateur, sur cet appareil. Vous pouvez l'effacer à tout moment depuis « Mon compte ».</Accordeon>
      <Accordeon titre="Livrez-vous hors de Casablanca ?">{boutique.livraison.zones ?? <A />}</Accordeon>
    </>,
  },
  'guide-des-tailles': {
    surtitre: 'Aide', titre: 'Guide des tailles', intro: 'Les tableaux de mesures par modèle seront publiés prochainement.',
    contenu: <div className="flex flex-col items-start gap-6"><p className="text-gris">En attendant, indiquez-nous votre taille habituelle et votre morphologie : nous vous conseillons personnellement.</p>
      <BoutonExterne href={lienWhatsApp('Bonjour H MODE, j\'ai besoin d\'un conseil de taille.')} variante="contour" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Conseil taille sur WhatsApp</BoutonExterne></div>,
  },
  'mentions-legales': { surtitre: 'Informations', titre: 'Mentions légales', contenu: <Gabarit sections={['Éditeur du site', 'Raison sociale et immatriculation', 'Hébergeur', 'Propriété intellectuelle']} /> },
  confidentialite: {
    surtitre: 'Informations', titre: 'Confidentialité',
    contenu: <>
      <Accordeon titre="Données enregistrées sur votre appareil" ouvertParDefaut>Le panier, les favoris et le compte sont stockés dans votre navigateur (stockage local). Ils ne sont transmis à aucun serveur et peuvent être effacés depuis « Mon compte ».</Accordeon>
      <Accordeon titre="Commandes et messages">Lorsque vous envoyez une commande ou un message, son contenu est transmis via WhatsApp, selon les conditions de WhatsApp.</Accordeon>
      <Accordeon titre="Responsable du traitement et contact"><A /></Accordeon>
    </>,
  },
  cgv: { surtitre: 'Informations', titre: 'Conditions générales de vente', contenu: <Gabarit sections={['Objet', 'Prix', 'Commande', 'Paiement', 'Livraison', 'Échanges et retours', 'Litiges']} /> },
}

function Gabarit({ sections }: { sections: string[] }) {
  return <>
    <p className="mb-6 bg-sable-50 p-5 text-[14px] text-gris">Texte juridique en cours de rédaction : il doit être fourni ou validé par la boutique.</p>
    {sections.map(s => <Accordeon key={s} titre={s}><A /></Accordeon>)}
  </>
}

export function PageInfo({ page }: { page: Cle }) {
  const p = PAGES[page]
  return (
    <>
      <EnTetePage surtitre={p.surtitre} titre={p.titre} texte={p.intro} ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: p.titre }]} />
      <Revelation className="conteneur max-w-3xl border-t border-ligne">{p.contenu}</Revelation>
    </>
  )
}
