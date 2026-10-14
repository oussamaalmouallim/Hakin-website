import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { Bouton, BoutonLien, Cadre, CaseACocher, Champ, EtatVide, IconeWhatsApp, ImageProduit, Selection, ZoneTexte } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { Recapitulatif } from '@/features/panier/Recapitulatif'
import { lignesDetaillees, nbArticles, sousTotal, usePanier } from '@/state/panier'
import { useCompte } from '@/state/compte'
import { formatDH, genererReference, telephoneMarocValide } from '@/lib/format'
import { boutique, estPackshot } from '@/lib/catalogue'
import { lienWhatsApp, messageCommande } from '@/lib/whatsapp'
import type { CoordonneesClient } from '@/lib/types'

export const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'El Jadida', 'Mohammédia', 'Autre ville']
type Erreurs = Partial<Record<keyof CoordonneesClient | 'cgv', string>>

export function validerCommande(c: CoordonneesClient, cgv: boolean): Erreurs {
  const e: Erreurs = {}
  if (c.nom.trim().length < 2) e.nom = 'Indiquez votre nom complet.'
  if (!telephoneMarocValide(c.telephone)) e.telephone = 'Numéro marocain attendu, ex. 06 12 34 56 78 ou +212 6 12 34 56 78.'
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = 'Adresse e-mail invalide.'
  if (!c.ville) e.ville = 'Choisissez votre ville.'
  if (c.adresse.trim().length < 6) e.adresse = 'Indiquez une adresse de livraison précise.'
  if (!cgv) e.cgv = 'Veuillez accepter les conditions de vente.'
  return e
}

function Etape({ n, titre, children }: { n: number; titre: string; children: ReactNode }) {
  return (
    // Bordure portée par le conteneur : sur un <fieldset>, la <legend> se poserait sur le filet.
    <div className="border-t border-ligne py-10">
      <fieldset className="min-w-0">
        <legend className="flex items-center gap-4">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-encre font-display text-[15px]">{n}</span>
          <span className="titre-3">{titre}</span>
        </legend>
        <div className="mt-8 grid gap-7 sm:grid-cols-2">{children}</div>
      </fieldset>
    </div>
  )
}

export function PageCommande() {
  const naviguer = useNavigate()
  const lignes = usePanier(s => s.lignes)
  const details = lignesDetaillees(lignes)
  const { profil, adresses } = useCompte()
  const parDefaut = adresses.find(a => a.parDefaut)
  const [c, setC] = useState<CoordonneesClient>({ nom: profil.nom, telephone: profil.telephone, email: profil.email,
    ville: parDefaut?.ville ?? '', adresse: parDefaut?.adresse ?? '', instructions: parDefaut?.instructions ?? '' })
  const [cgv, setCgv] = useState(false)
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const formulaire = useRef<HTMLFormElement>(null)
  const reference = useMemo(() => genererReference(), [])
  const maj = (k: keyof CoordonneesClient) => (e: { target: { value: string } }) => { setC(x => ({ ...x, [k]: e.target.value })); setErreurs(x => ({ ...x, [k]: undefined })) }

  if (!details.length) {
    return (<><EnTetePage titre="Commande" /><EtatVide titre="Votre panier est vide" texte="Ajoutez des pièces avant de passer commande." action={<BoutonLien to="/boutique">Découvrir la boutique</BoutonLien>} /></>)
  }

  const total = sousTotal(lignes)
  const nb = nbArticles(lignes)
  const resume = (
    <>
      <ul className="mb-6 flex flex-col gap-4">
        {details.map(l => (
          <li key={l.cle} className="flex items-center gap-4">
            <div className="relative w-14 shrink-0"><Cadre compact className="aspect-[4/5]"><ImageProduit src={l.produit.images[0].src} alt="" packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="56px" /></Cadre>
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-encre text-[10px] text-nacre" aria-label={`Quantité ${l.quantite}`}>{l.quantite}</span></div>
            <div className="min-w-0 flex-1 text-[14px]"><p className="truncate">{l.produit.nom}</p><p className="capitalize text-gris">{l.coloris} · {l.taille}</p></div>
          </li>
        ))}
      </ul>
      <Recapitulatif sousTotalDH={total} nbArticles={nb} />
    </>
  )

  const envoyer = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validerCommande(c, cgv)
    setErreurs(e)
    if (Object.keys(e).length) {
      window.setTimeout(() => formulaire.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    const msg = messageCommande(reference, details.map(l => ({ nom: `${l.produit.marque} — ${l.produit.nom}`, coloris: l.coloris, taille: l.taille, quantite: l.quantite, prixDH: l.prixDH })), c)
    const lien = lienWhatsApp(msg)
    window.open(lien, '_blank', 'noopener,noreferrer')
    naviguer('/commande/confirmation', { state: { reference, client: c, lien } })
  }

  return (
    <>
      <EnTetePage surtitre="Commande" titre="Finaliser votre commande" texte="Votre commande est transmise sur WhatsApp, où nous la confirmons avec vous. Paiement à la livraison."
        ariane={[{ libelle: 'Panier', vers: '/panier' }, { libelle: 'Commande' }]} />
      <div className="conteneur grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-20">
        <details className="group -mb-12 border-t border-ligne lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
            <span className="label inline-flex items-center gap-2">Votre commande · {nb} article{nb > 1 ? 's' : ''}
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden /></span>
            <span className="tabular-nums">{formatDH(total)}</span>
          </summary>
          <div className="pb-6">{resume}</div>
        </details>
        <form ref={formulaire} noValidate onSubmit={envoyer} aria-label="Formulaire de commande">
          <Etape n={1} titre="Vos coordonnées">
            <Champ label="Nom complet" autoComplete="name" value={c.nom} onChange={maj('nom')} erreur={erreurs.nom} required />
            <Champ label="Téléphone (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={c.telephone} onChange={maj('telephone')} erreur={erreurs.telephone} required />
            <div className="sm:col-span-2"><Champ label="E-mail" type="email" autoComplete="email" facultatif value={c.email} onChange={maj('email')} erreur={erreurs.email} /></div>
          </Etape>
          <Etape n={2} titre="Livraison">
            <Selection label="Ville" value={c.ville} onChange={maj('ville')} erreur={erreurs.ville} required>
              <option value="">Choisir…</option>{VILLES.map(v => <option key={v}>{v}</option>)}
            </Selection>
            <Champ label="Adresse" autoComplete="street-address" value={c.adresse} onChange={maj('adresse')} erreur={erreurs.adresse} required />
            <div className="sm:col-span-2"><ZoneTexte label="Instructions de livraison" facultatif rows={2} value={c.instructions} onChange={maj('instructions')} placeholder="Étage, repère, horaires…" /></div>
          </Etape>
          <Etape n={3} titre="Paiement">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-4 border border-encre p-5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-encre text-nacre"><Check className="h-3 w-3" /></span>
                <div><p className="font-display text-[19px]">{boutique.paiement}</p><p className="text-[14px] text-gris">Vous réglez à la réception de votre commande.</p></div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <CaseACocher checked={cgv} onChange={() => { setCgv(v => !v); setErreurs(x => ({ ...x, cgv: undefined })) }} erreur={erreurs.cgv}
                label={<>J'accepte les <Link to="/cgv" target="_blank" className="underline underline-offset-4">conditions de vente</Link>.</>} />
            </div>
          </Etape>
          <div className="border-t border-ligne pt-10">
            <p className="mb-5 flex items-baseline justify-between text-[17px]"><span>Total estimé · {nb} article{nb > 1 ? 's' : ''}</span><span className="tabular-nums">{formatDH(total)}</span></p>
            <Bouton type="submit" taille="lg" plein_largeur icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Envoyer ma commande sur WhatsApp</Bouton>
            <p className="mt-4 text-center text-[13px] text-gris">WhatsApp s'ouvre avec votre commande pré-remplie (réf. {reference}). Il vous suffit d'appuyer sur « Envoyer ».</p>
          </div>
        </form>
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">{resume}</aside>
      </div>
    </>
  )
}
