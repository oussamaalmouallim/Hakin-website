import type { ReactNode } from 'react'
import { Accordeon, AConfirmer, BoutonExterne, IconeWhatsApp, Revelation } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { boutique, textes } from '@/lib/catalogue'
import { listeVilles, livraisonLimitee, villesLivrees } from '@/lib/livraison'
import { SECTIONS_TEXTES } from '@/lib/produitsBase'
import { lienWhatsApp } from '@/lib/whatsapp'

type Cle = 'livraison-retours' | 'faq' | 'guide-des-tailles' | 'mentions-legales' | 'confidentialite' | 'cgv'
const A = () => <AConfirmer>À confirmer par la boutique</AConfirmer>

/** Pages d'information. Coordonnées, livraison et retours viennent des réglages ; textes juridiques et guide des tailles
 *  de l'administration (lot 20). Calculées à l'affichage, pour suivre les données de la base. Vide = « À confirmer ». */
const pages = (): Record<Cle, { surtitre: string; titre: string; intro?: string; contenu: ReactNode }> => ({
  'livraison-retours': {
    surtitre: 'Aide', titre: 'Livraison & retours', intro: 'Chaque commande est confirmée avec vous sur WhatsApp avant expédition.',
    contenu: <>
      <Accordeon titre="Paiement" ouvertParDefaut>{boutique.paiement}.</Accordeon>
      <Accordeon titre="Zones de livraison">{boutique.livraison.zones ?? (livraisonLimitee() ? listeVilles(villesLivrees()) : <A />)}</Accordeon>
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
      <Accordeon titre="Dois-je créer un compte ?">Non : vous pouvez commander sans compte. Avec un compte, votre panier, vos favoris, vos adresses et vos commandes vous suivent sur tous vos appareils.</Accordeon>
      <Accordeon titre="Livrez-vous hors de Casablanca ?">{livraisonLimitee() ? `Pour le moment, nous livrons à domicile à ${listeVilles(villesLivrees())} seulement.` : boutique.livraison.zones ?? <A />}</Accordeon>
    </>,
  },
  'guide-des-tailles': {
    surtitre: 'Aide', titre: 'Guide des tailles', intro: textes.guideDesTailles ? undefined : 'Les tableaux de mesures par modèle seront publiés prochainement.',
    contenu: <div className="flex flex-col items-start gap-6">{textes.guideDesTailles
      ? <p className="whitespace-pre-line text-[15px] leading-[1.7]">{textes.guideDesTailles}</p>
      : <p className="text-gris">En attendant, indiquez-nous votre taille habituelle et votre morphologie : nous vous conseillons personnellement.</p>}
      <BoutonExterne href={lienWhatsApp('Bonjour H MODE, j\'ai besoin d\'un conseil de taille.')} variante="contour" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Conseil taille sur WhatsApp</BoutonExterne></div>,
  },
  'mentions-legales': { surtitre: 'Informations', titre: 'Mentions légales', contenu: <Gabarit sections={SECTIONS_TEXTES['mentions-legales']} valeurs={textes['mentions-legales']} /> },
  confidentialite: {
    surtitre: 'Informations', titre: 'Confidentialité',
    contenu: <>
      <Accordeon titre="Données enregistrées" ouvertParDefaut>Sans compte, le panier et les favoris restent dans votre navigateur (stockage local) et peuvent être effacés depuis « Mon compte ». Avec un compte, votre profil, vos adresses, votre panier, vos favoris et vos commandes sont enregistrés dans votre compte H MODE : vous seul y avez accès, et ils sont retirés de l'appareil à la déconnexion.</Accordeon>
      <Accordeon titre="Commandes et messages">Lorsque vous envoyez une commande ou un message, son contenu est transmis via WhatsApp, selon les conditions de WhatsApp.</Accordeon>
      <Accordeon titre="Responsable du traitement et contact">{textes.confidentialiteResponsable ? <span className="whitespace-pre-line">{textes.confidentialiteResponsable}</span> : <A />}</Accordeon>
    </>,
  },
  cgv: { surtitre: 'Informations', titre: 'Conditions générales de vente', contenu: <Gabarit sections={SECTIONS_TEXTES.cgv} valeurs={textes.cgv} /> },
})

function Gabarit({ sections, valeurs }: { sections: readonly string[]; valeurs: Record<string, string> }) {
  const incomplet = sections.some(s => !valeurs[s])
  return <>
    {incomplet && <p className="mb-6 rounded-bloc border border-ligne bg-fond-2 p-5 text-[14px] text-gris">Texte juridique en cours de rédaction : il doit être fourni ou validé par la boutique.</p>}
    {sections.map((s, i) => <Accordeon key={s} titre={s} ouvertParDefaut={i === 0 && !incomplet}>{valeurs[s] ? <span className="whitespace-pre-line">{valeurs[s]}</span> : <A />}</Accordeon>)}
  </>
}

export function PageInfo({ page }: { page: Cle }) {
  const p = pages()[page]
  return (
    <>
      <EnTetePage surtitre={p.surtitre} titre={p.titre} texte={p.intro} ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: p.titre }]} />
      <Revelation className="conteneur max-w-3xl border-t border-ligne">{p.contenu}</Revelation>
    </>
  )
}
