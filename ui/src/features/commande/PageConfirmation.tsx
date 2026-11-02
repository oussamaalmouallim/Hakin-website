import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Bouton, BoutonExterne, BoutonLien, IconeWhatsApp, PastilleCouleur, Revelation } from '@/design-system'
import { useSession } from '@/state/session'
import type { LigneACommander } from '@/lib/commandes'
import { lignesDetaillees, sousTotal, usePanier } from '@/state/panier'
import { useCompte } from '@/state/compte'
import { formatDH } from '@/lib/format'
import { lienCommandeDirecte } from '@/lib/commandeDirecte'
import type { CoordonneesClient, LignePanier } from '@/lib/types'

/** Deux cas.
 *  - Commande enregistrée dans Supabase (`enregistree`) : elle existe côté boutique ; le récapitulatif est envoyé sur WhatsApp en plus.
 *  - Site sans serveur (ADR 0001) : la commande n'existe que dans WhatsApp ; le panier n'est vidé qu'à la demande du client. */
export function PageConfirmation() {
  const etat = useLocation().state as { reference: string; client: CoordonneesClient; lien: string; directe?: LignePanier[]; enregistree?: boolean; lignes?: LigneACommander[]; totalDH?: number } | null
  const connecte = useSession(s => Boolean(s.utilisateur))
  const panier = usePanier(s => s.lignes)
  // Commande directe : ses lignes viennent de l'état de navigation, et le panier n'est pas vidé.
  const lignes = etat?.directe ?? panier
  const vider = usePanier(s => s.vider)
  const ajouterCommande = useCompte(s => s.ajouterCommande)
  const majProfil = useCompte(s => s.majProfil)
  const [envoyee, setEnvoyee] = useState(false)
  if (!etat) return <Navigate to="/panier" replace />
  if (etat.enregistree) return <CommandeEnregistree reference={etat.reference} client={etat.client} lien={etat.lien} lignes={etat.lignes ?? []} totalDH={etat.totalDH ?? 0} connecte={connecte} />
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

/** cloneme: C-24 — confirmation d'une commande enregistrée : pastille jaune cochée, référence mono, titre Archivo Black, récapitulatif à filets. */
function CommandeEnregistree({ reference, client, lien, lignes, totalDH, connecte }: { reference: string; client: CoordonneesClient; lien: string; lignes: LigneACommander[]; totalDH: number; connecte: boolean }) {
  return (
    <section className="conteneur flex min-h-[80vh] flex-col items-center justify-center pb-16 pt-28 text-center">
      <Revelation className="flex w-full max-w-xl flex-col items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-encre"><Check className="h-7 w-7" strokeWidth={2.25} /></span>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-gris">Référence {reference}</p>
        <h1 className="mt-4 font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em]">Commande enregistrée</h1>
        <p className="mt-6 text-[15px] leading-[1.55] text-gris">
          Merci, {client.nom.split(' ')[0]}. Nous vous contactons sur WhatsApp au {client.telephone} pour confirmer la livraison à {client.ville}. Paiement à la livraison.
        </p>
        {lignes.length > 0 && (
          <ul className="mt-10 w-full border-y border-ligne text-left">
            {lignes.map(l => (
              <li key={`${l.slug}|${l.coloris}|${l.taille}`} className="flex items-center justify-between gap-4 border-b border-ligne py-3 last:border-b-0">
                <span className="min-w-0">
                  <span className="block truncate font-display text-[13px] uppercase">{l.nom}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gris">Taille {l.taille}<span aria-hidden>·</span><PastilleCouleur nom={l.coloris} /><span aria-hidden>·</span>Qté {l.quantite}</span>
                </span>
                <span className="shrink-0 font-display text-[14px] tabular-nums">{formatDH(l.prixDH * l.quantite)}</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between py-3"><span className="font-display text-[15px] uppercase tracking-[0.08em]">Total à payer à la livraison</span><span className="font-display text-[22px] tabular-nums">{formatDH(totalDH)}</span></li>
          </ul>
        )}
        <div className="mt-10 flex flex-col items-center gap-4">
          <BoutonExterne href={lien} taille="lg" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Envoyer le récapitulatif sur WhatsApp</BoutonExterne>
          <div className="flex flex-wrap justify-center gap-3">
            {connecte ? <BoutonLien to="/compte/commandes" variante="contour">Mes commandes</BoutonLien> : <BoutonLien to="/connexion?mode=inscription&retour=/compte/commandes" variante="contour">Créer un compte</BoutonLien>}
            <BoutonLien to="/boutique" variante="texte">Continuer mes achats</BoutonLien>
          </div>
        </div>
      </Revelation>
    </section>
  )
}
