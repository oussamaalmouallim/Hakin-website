import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { EMAIL_VALIDE, LONGUEURS, tropLong } from '@/lib/longueurs'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Loader2 } from 'lucide-react'
import { BoutonLien, EtatVide, ImageProduit, PastilleCouleur } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { ChampLigne, SelectionLigne, ZoneLigne } from '@/components/ChampLigne'
import { lignesDetaillees, nbArticles, usePanier } from '@/state/panier'
import { useCompte } from '@/state/compte'
import { useSession } from '@/state/session'
import { rafraichirCommandes } from '@/state/synchroCompte'
import { formatDH, genererReference, telephoneMarocValide } from '@/lib/format'
import { boutique, estPackshot, trouverProduit } from '@/lib/catalogue'
import { ligneDirecte } from '@/lib/commandeDirecte'
import { enregistrerCommande } from '@/lib/commandes'
import { supabaseActif } from '@/lib/supabase'
import { lienWhatsApp, messageCommande } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import type { CoordonneesClient } from '@/lib/types'
import { listeVilles, villesLivrees } from '@/lib/livraison'

type Erreurs = Partial<Record<keyof CoordonneesClient | 'cgv', string>>

export function validerCommande(c: CoordonneesClient, cgv: boolean): Erreurs {
  const e: Erreurs = {}
  if (c.nom.trim().length < 2) e.nom = 'Indiquez votre nom complet.'
  else if (tropLong(c.nom, 'nom')) e.nom = tropLong(c.nom, 'nom')
  if (!telephoneMarocValide(c.telephone)) e.telephone = 'Numéro marocain attendu, ex. 06 12 34 56 78 ou +212 6 12 34 56 78.'
  if (c.email && (!EMAIL_VALIDE.test(c.email.trim()) || tropLong(c.email, 'email'))) e.email = 'Adresse e-mail invalide.'
  if (!c.ville) e.ville = 'Choisissez votre ville.'
  else if (!villesLivrees().includes(c.ville)) e.ville = `Nous livrons seulement à ${listeVilles(villesLivrees())} pour le moment.`
  if (c.adresse.trim().length < 6) e.adresse = 'Indiquez une adresse de livraison précise.'
  else if (tropLong(c.adresse, 'adresse')) e.adresse = tropLong(c.adresse, 'adresse')
  if (tropLong(c.instructions, 'instructions')) e.instructions = tropLong(c.instructions, 'instructions')
  if (!cgv) e.cgv = 'Veuillez accepter les conditions de vente.'
  return e
}

/** Une seule ville livrée : elle est déjà choisie. */
const villeUnique = () => { const v = villesLivrees(); return v.length === 1 ? v[0] : '' }

/** cloneme: C-28 — section numérotée du checkout de la référence : titre Archivo Black 18 px .04em, pastille jaune 28 px chiffre mono 12 px. */
function Section({ n, titre, children }: { n: number; titre: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`etape-${n}`}>
      <h2 id={`etape-${n}`} className="mb-6 flex items-center gap-3 font-display text-[18px] uppercase leading-[1.5] tracking-[0.04em]">
        <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-accent font-mono text-[12px] leading-[1.5]">{n}</span>{titre}
      </h2>
      {children}
    </section>
  )
}

/** cloneme: P-05 — checkout de la référence (`/checkout`) : retour mono + « Commander » 32 px, grille 1fr / 440 px écart 48 px ;
 *  à gauche 3 sections (adresse, livraison, paiement), à droite récapitulatif noir collant (C-29).
 *  Écart voulu : deux colonnes dès 1024 px (la référence les pose dès 768 px et déborde alors horizontalement).
 *  H MODE : paiement à la livraison uniquement (pas d'avance), frais et délai « À confirmer », pas de code promo ;
 *  commande enregistrée dans Supabase (`passer_commande`) puis envoyée sur WhatsApp. */
export function PageCommande() {
  const naviguer = useNavigate()
  const { pathname, search } = useLocation()
  const [sp] = useSearchParams()
  const panier = usePanier(s => s.lignes)
  const vider = usePanier(s => s.vider)
  // Commande directe (`?article=…`) : cette seule pièce, le panier reste intact.
  const directe = sp.has('article') ? ligneDirecte(sp) : null
  const lignes = directe ? [directe] : panier
  const details = lignesDetaillees(lignes)
  const { profil, adresses, majProfil, enregistrerAdresse, ajouterCommande } = useCompte()
  const utilisateur = useSession(s => s.utilisateur)
  const parDefaut = adresses.find(a => a.parDefaut)
  const [c, setC] = useState<CoordonneesClient>({ nom: profil.nom, telephone: profil.telephone, email: profil.email,
    ville: parDefaut?.ville ?? villeUnique(), adresse: parDefaut?.adresse ?? '', instructions: parDefaut?.instructions ?? '' })
  const [cgv, setCgv] = useState(false)
  const [memoriser, setMemoriser] = useState(true)
  // E-mail et instructions (facultatifs, absents de la référence) : repliés, ouverts d'office s'ils sont déjà remplis.
  const [precisions, setPrecisions] = useState(Boolean(profil.email || parDefaut?.instructions))
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [envoi, setEnvoi] = useState(false)
  const [alerte, setAlerte] = useState<string | null>(null)
  const formulaire = useRef<HTMLFormElement>(null)
  const reference = useMemo(() => genererReference(), [])
  const maj = (k: keyof CoordonneesClient) => (e: { target: { value: string } }) => { setC(x => ({ ...x, [k]: e.target.value })); setErreurs(x => ({ ...x, [k]: undefined })) }

  // Compte chargé après l'arrivée sur la page (connexion, actualisation) : on complète seulement les champs encore vides.
  useEffect(() => {
    setC(x => ({ nom: x.nom || profil.nom, telephone: x.telephone || profil.telephone, email: x.email || profil.email,
      ville: x.ville || parDefaut?.ville || villeUnique(), adresse: x.adresse || parDefaut?.adresse || '', instructions: x.instructions || parDefaut?.instructions || '' }))
  }, [profil, parDefaut])

  if (sp.has('article') && !details.length) {
    const p = trouverProduit(sp.get('article') ?? '')
    return (<><EnTetePage titre="Commande" /><EtatVide titre="Variante indisponible" texte="Cette pièce n'est pas disponible dans la taille, la couleur ou la quantité demandée."
      action={<BoutonLien to={p ? `/produit/${p.slug}` : '/boutique'}>{p ? 'Revenir à la pièce' : 'Découvrir la boutique'}</BoutonLien>} /></>)
  }
  if (!details.length) {
    return (<><EnTetePage titre="Commande" /><EtatVide titre="Votre panier est vide" texte="Ajoutez des pièces avant de passer commande." action={<BoutonLien to="/boutique">Découvrir la boutique</BoutonLien>} /></>)
  }

  const total = details.reduce((s, l) => s + l.totalDH, 0)
  const nb = nbArticles(details)
  const adresseConnue = adresses.some(a => a.ville === c.ville && a.adresse.trim() === c.adresse.trim())
  const retour = directe ? { vers: `/produit/${directe.slug}`, libelle: 'Retour à la pièce' } : { vers: '/panier', libelle: 'Retour au panier' }

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    if (envoi) return
    setAlerte(null)
    const e = validerCommande(c, cgv)
    setErreurs(e)
    if (Object.keys(e).length) {
      if (e.email) setPrecisions(true)
      window.setTimeout(() => formulaire.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    const aCommander = details.map(l => ({ slug: l.slug, nom: l.produit.nom, coloris: l.coloris, taille: l.taille, quantite: l.quantite, prixDH: l.prixDH }))
    const msg = messageCommande(reference, details.map(l => ({ nom: `${l.produit.marque} — ${l.produit.nom}`, coloris: l.coloris, taille: l.taille, quantite: l.quantite, prixDH: l.prixDH })), c)
    const lien = lienWhatsApp(msg)

    // Site sans serveur : fonctionnement d'origine (ADR 0001), la commande part sur WhatsApp et le client confirme l'envoi.
    if (!supabaseActif) {
      window.open(lien, '_blank', 'noopener,noreferrer')
      naviguer('/commande/confirmation', { state: { reference, client: c, lien, ...(directe && { directe: [directe] }) } })
      return
    }

    // Onglet ouvert pendant le clic (sinon bloqué par le navigateur), dirigé vers WhatsApp une fois la commande enregistrée.
    const onglet = window.open('', '_blank')
    setEnvoi(true)
    // Un échec inattendu (fichier du site introuvable après une mise à jour, réseau coupé) ne doit pas bloquer le bouton.
    const r = await enregistrerCommande(reference, c, aCommander)
      .catch(() => ({ statut: 'erreur' as const, message: 'Connexion au serveur impossible. Rechargez la page, puis réessayez.' }))
    setEnvoi(false)
    if (r.statut !== 'enregistree') {
      onglet?.close()
      setAlerte(r.statut === 'erreur' ? r.message : 'Les commandes ne peuvent pas être enregistrées pour le moment.')
      return
    }
    if (onglet) { onglet.opener = null; onglet.location.href = lien }

    // Commande enregistrée : le panier est vidé (pas pour une commande directe), les coordonnées complètent le compte.
    if (!directe) vider()
    majProfil({ nom: profil.nom || c.nom.trim(), telephone: profil.telephone || c.telephone.trim(), email: profil.email || c.email.trim() })
    if (utilisateur && memoriser && !adresseConnue) {
      enregistrerAdresse({ libelle: c.ville, ville: c.ville, adresse: c.adresse.trim(), instructions: c.instructions.trim(), parDefaut: adresses.length === 0 })
    }
    if (utilisateur) void rafraichirCommandes()
    else ajouterCommande({ reference: r.reference, date: new Date().toISOString(), sousTotalDH: total, client: c,
      lignes: aCommander.map(l => ({ ...l, cle: `${l.slug}|${l.coloris}|${l.taille}` })) })
    naviguer('/commande/confirmation', { replace: true, state: { reference: r.reference, client: c, lien, enregistree: true, lignes: aCommander, totalDH: total } })
  }

  const etiquetteRecap = 'font-mono text-[10px] uppercase tracking-[0.16em] text-fond/50'
  return (
    <div className="min-h-screen pt-20">
      <div className="px-5 py-8 md:px-14">
        <div className="relative">
          <Link to={retour.vers} data-ref="co-retour" className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gris transition-colors hover:text-encre">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />{retour.libelle}
          </Link>
          {supabaseActif && !utilisateur && (
            <Link to={`/connexion?retour=${encodeURIComponent(pathname + search)}`} className="absolute right-0 top-0 font-mono text-[11px] uppercase tracking-[0.18em] text-gris underline underline-offset-4 hover:text-encre">
              Déjà client ? Se connecter
            </Link>
          )}
        </div>
        <h1 className="mb-8 font-display text-[32px] uppercase leading-[1.5] tracking-[0.02em]">Commander</h1>

        <form ref={formulaire} noValidate onSubmit={envoyer} aria-label="Formulaire de commande" className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_440px]">
          <div className="flex min-w-0 flex-col gap-10">
            <Section n={1} titre="Adresse de livraison">
              {utilisateur && adresses.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Adresses enregistrées">
                  {adresses.map(a => {
                    const choisie = a.ville === c.ville && a.adresse === c.adresse
                    return (
                      <button key={a.id} type="button" aria-pressed={choisie} onClick={() => { setC(x => ({ ...x, ville: a.ville, adresse: a.adresse, instructions: a.instructions })); setErreurs(x => ({ ...x, ville: undefined, adresse: undefined })) }}
                        className={cn('rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors', choisie ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-encre hover:border-encre')}>
                        {a.libelle || a.ville}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="grid gap-4">
                <ChampLigne data-ref="co-nom" label="Nom complet" autoComplete="name" value={c.nom} onChange={maj('nom')} erreur={erreurs.nom} />
                <ChampLigne label="Téléphone (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={c.telephone} onChange={maj('telephone')} erreur={erreurs.telephone} />
                <SelectionLigne label="Ville" value={c.ville} onChange={maj('ville')} erreur={erreurs.ville}>
                  <option value="">Choisir…</option>{villesLivrees().map(v => <option key={v}>{v}</option>)}
                </SelectionLigne>
                <ChampLigne label="Adresse" autoComplete="street-address" value={c.adresse} onChange={maj('adresse')} erreur={erreurs.adresse} />
                {precisions ? (<>
                  <ChampLigne label="E-mail" type="email" autoComplete="email" facultatif value={c.email} onChange={maj('email')} erreur={erreurs.email} />
                  <ZoneLigne label="Instructions de livraison" facultatif rows={2} maxLength={LONGUEURS.instructions} erreur={erreurs.instructions} value={c.instructions} onChange={maj('instructions')} placeholder="Étage, repère, horaires…" />
                </>) : (
                  <button type="button" onClick={() => setPrecisions(true)} className="w-fit font-mono text-[11px] uppercase tracking-[0.16em] text-gris underline underline-offset-4 hover:text-encre">
                    + E-mail ou instructions de livraison
                  </button>
                )}
                {utilisateur && !adresseConnue && c.adresse.trim().length >= 6 && (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={memoriser} onChange={() => setMemoriser(v => !v)} className="accent-encre" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gris">Enregistrer cette adresse dans mon compte</span>
                  </label>
                )}
              </div>
            </Section>

            <Section n={2} titre="Livraison">
              {/* Référence : carte filet encre rayon 14 px fond --fond-2. Frais et délai non communiqués par la boutique : « À confirmer ». */}
              <div className="flex items-center gap-4 rounded-[14px] border border-encre bg-fond-2 p-4">
                <div className="flex-1">
                  <p className="font-display text-[14px] uppercase tracking-[0.04em]">À domicile</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-gris">{boutique.livraison.delai ?? 'Délai sur WhatsApp'}{boutique.livraison.zones ? ` · ${boutique.livraison.zones}` : ''}</p>
                </div>
                <span className="shrink-0 font-display text-[16px] text-accent">{boutique.livraison.fraisDH === null ? 'À confirmer' : boutique.livraison.fraisDH === 0 ? 'Offerte' : formatDH(boutique.livraison.fraisDH)}</span>
              </div>
            </Section>

            <Section n={3} titre="Méthode de paiement">
              {/* Référence : carte filet 2 px encre rayon 18 px, icône sur carré encre 48 px, bouton radio plein, coches jaunes. Sans avance chez H MODE. */}
              <div className="rounded-[18px] border-2 border-encre bg-fond-2 p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-encre text-fond"><Banknote className="h-5 w-5" strokeWidth={1.75} /></div>
                  <div>
                    <p className="font-display text-[16px] uppercase tracking-[0.04em]">{boutique.paiement}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gris">Vous réglez à la réception</p>
                  </div>
                  <span aria-hidden className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-encre"><span className="h-3 w-3 rounded-full bg-encre" /></span>
                </div>
                <div className="mb-4 rounded-xl border border-ligne-forte bg-fond p-4">
                  <p className="mb-1 font-display text-[14px] uppercase tracking-[0.04em]">Confirmation avant l'expédition</p>
                  <p className="text-[13px] leading-[1.5] text-gris">Une fois la commande enregistrée, nous vous écrivons sur WhatsApp pour confirmer les pièces, l'adresse et la livraison.</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {['Aucune carte bancaire requise', 'Rien à payer en ligne', 'Commande confirmée avec vous sur WhatsApp'].map(t => (
                    <li key={t} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gris"><span className="font-display text-[14px] text-accent">✓</span>{t}</li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>

          {/* cloneme: C-29 — récapitulatif de la référence : bloc encre rayon 24 px `p-8` collant, vignettes 56 px, totaux à filets,
              encart jaune, bouton jaune « Passer la commande » (+2 % au survol), mention mono 9 px. */}
          <aside className="self-start rounded-3xl bg-encre p-8 text-fond lg:sticky lg:top-[100px]">
            <h2 className="mb-6 font-display text-[18px] uppercase leading-[1.5] tracking-[0.04em]">Récapitulatif</h2>
            <ul className="mb-6 flex flex-col gap-4">
              {details.map(l => (
                <li key={l.cle} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-fond/[0.06]">
                    <ImageProduit src={l.produit.images[0].src} alt="" packshot={estPackshot(l.produit)} className="absolute inset-0" tailles="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13px]">{l.produit.nom}</p>
                    <p className={cn(etiquetteRecap, 'mt-0.5 flex items-center gap-1.5')}>Taille {l.taille}<span aria-hidden>·</span><PastilleCouleur nom={l.coloris} /><span aria-hidden>·</span>Qté {l.quantite}</p>
                  </div>
                  <span className="shrink-0 font-display text-[14px] tabular-nums">{formatDH(l.totalDH)}</span>
                </li>
              ))}
            </ul>
            {/* À la place du code promo de la référence (aucun chez H MODE) : acceptation des conditions, même rangée `mb-6` */}
            <div className="mb-6">
            <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={cgv} onChange={() => { setCgv(v => !v); setErreurs(x => ({ ...x, cgv: undefined })) }} aria-invalid={erreurs.cgv ? true : undefined} className="mt-[2px] accent-accent" />
                <span className="font-mono text-[10px] uppercase leading-[1.5] tracking-[0.16em] text-fond/70">
                  J'accepte les <Link to="/cgv" target="_blank" className="text-fond underline underline-offset-2">conditions de vente</Link> et la <Link to="/confidentialite" target="_blank" className="text-fond underline underline-offset-2">politique de confidentialité</Link>
                </span>
              </label>
              {erreurs.cgv && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">{erreurs.cgv}</p>}
            </div>
            <div className="mb-6 flex flex-col gap-2 border-t border-fond/10 pt-4">
              <div className="flex justify-between text-[13px] text-fond/60"><span>Sous-total · {nb} article{nb > 1 ? 's' : ''}</span><span className="tabular-nums">{formatDH(total)}</span></div>
              <div className="flex justify-between text-[13px] text-fond/60"><span>Livraison</span><span>{boutique.livraison.fraisDH === null ? 'À confirmer' : boutique.livraison.fraisDH === 0 ? 'Offerte' : formatDH(boutique.livraison.fraisDH)}</span></div>
              <div className="mt-2 flex items-baseline justify-between border-t border-fond/10 pt-2">
                <span className="font-display text-[15px] uppercase tracking-[0.08em]">Total</span>
                <span data-ref="co-total" className="font-display text-[26px] tabular-nums">{formatDH(total)}</span>
              </div>
            </div>
            <div data-ref="co-encart" className="mb-6 rounded-[18px] bg-accent p-5 text-encre shadow-[0_8px_28px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[14px] uppercase leading-[1.25] tracking-[0.04em]">À payer à la livraison</p>
                <p className="whitespace-nowrap font-display text-[28px] leading-none tabular-nums">{formatDH(total)}</p>
              </div>
              <p className="mt-3 text-[13px] leading-[1.5]">Rien à payer en ligne.</p>
              <p className="mt-1 text-[13px] font-semibold leading-[1.5]">Vous réglez à la réception</p>
            </div>
            {alerte && <p role="alert" className="mb-4 rounded-[10px] border border-danger/50 bg-danger/20 px-4 py-3 text-[13px] leading-[1.5] text-fond">{alerte}</p>}
            <button type="submit" disabled={envoi} aria-busy={envoi}
              className="flex w-full items-center justify-center gap-3 rounded-full border-none bg-accent py-4 font-display text-[13px] uppercase tracking-[0.16em] text-encre transition-all hover:scale-[1.02] hover:bg-accent-doux disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
              {envoi && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{envoi ? 'Enregistrement…' : 'Passer la commande'}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-fond/40">
              {supabaseActif ? `Réf. ${reference} · enregistrée puis envoyée sur WhatsApp` : `Réf. ${reference} · envoyée sur WhatsApp, pré-remplie`}
            </p>
          </aside>
        </form>
      </div>
    </div>
  )
}
