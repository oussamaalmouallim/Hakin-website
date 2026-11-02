import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Bouton, BoutonExterne, BoutonLien, IconeWhatsApp, Revelation } from '@/design-system'
import { lignesDetaillees, sousTotal, usePanier } from '@/state/panier'
import { useCompte } from '@/state/compte'
import { formatDH } from '@/lib/format'
import { lienCommandeDirecte } from '@/lib/commandeDirecte'
import type { CoordonneesClient, LignePanier } from '@/lib/types'

/** La commande n'est validée par aucun système : elle est confirmée sur WhatsApp. Le panier n'est vidé qu'à la demande du client. */
export function PageConfirmation() {
  const etat = useLocation().state as { reference: string; client: CoordonneesClient; lien: string; directe?: LignePanier[] } | null
  const panier = usePanier(s => s.lignes)
  // Commande directe : ses lignes viennent de l'état de navigation, et le panier n'est pas vidé.
  const lignes = etat?.directe ?? panier
  const vider = usePanier(s => s.vider)
  const ajouterCommande = useCompte(s => s.ajouterCommande)
  const majProfil = useCompte(s => s.majProfil)
  const [envoyee, setEnvoyee] = useState(false)
  if (!etat) return <Navigate to="/panier" replace />
  const details = lignesDetaillees(lignes)
  const total = sousTotal(lignes)

  const confirmer = () => {
    if (details.length) {
      ajouterCommande({ reference: etat.reference, date: new Date().toISOString(), sousTotalDH: total, client: etat.client,
        lignes: details.map(l => ({ cle: l.cle, slug: l.slug, coloris: l.coloris, taille: l.taille, quantite: l.quantite, nom: l.produit.nom, prixDH: l.prixDH })) })
      majProfil({ nom: etat.client.nom, telephone: etat.client.telephone, email: etat.client.email })
    }
    if (!etat.directe) vider()
    setEnvoyee(true)
  }

  return (
    <section className="conteneur flex min-h-[80vh] flex-col items-center justify-center pt-20 text-center">
      <Revelation className="flex max-w-xl flex-col items-center">
        {/* cloneme: C-24 — confirmation : pastille jaune, référence en mono, titre Archivo Black. */}
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-encre"><IconeWhatsApp className="h-7 w-7" /></span>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-gris">Référence {etat.reference}</p>
        {envoyee ? (
          <>
            <h1 className="mt-4 font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em]">Merci, {etat.client.nom.split(' ')[0]}</h1>
            <p className="mt-6 text-[15px] leading-[1.55] text-gris">Nous confirmons votre commande avec vous sur WhatsApp, au {etat.client.telephone}. Vous la retrouvez dans votre compte.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <BoutonLien to="/compte/commandes">Mes commandes</BoutonLien>
              <BoutonLien to="/boutique" variante="contour">Continuer mes achats</BoutonLien>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em]">Plus qu'une étape</h1>
            <p className="mt-6 text-[15px] leading-[1.55] text-gris">WhatsApp s'est ouvert avec votre commande{details.length ? ` (${formatDH(total)})` : ''}. Appuyez sur « Envoyer » dans WhatsApp : nous vous répondons pour confirmer la livraison.</p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Bouton onClick={confirmer} taille="lg">J'ai envoyé ma commande</Bouton>
              <BoutonExterne href={etat.lien} variante="texte" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>WhatsApp ne s'est pas ouvert ? Réessayer</BoutonExterne>
              <BoutonLien to={etat.directe ? lienCommandeDirecte(etat.directe[0].slug, etat.directe[0].coloris, etat.directe[0].taille, etat.directe[0].quantite) : '/commande'} variante="texte">Modifier ma commande</BoutonLien>
            </div>
          </>
        )}
      </Revelation>
    </section>
  )
}
