import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Maximize2 } from 'lucide-react'
import {
  AConfirmer, Bouton, BoutonExterne, IconeWhatsApp, ImageProduit, Modale, PastilleCouleur, Prix, Quantite,
  Revelation, SelecteurColoris, SelecteurTaille, useNotifier,
} from '@/design-system'
import { formatDH } from '@/lib/format'
import { CarteProduit } from '@/components/CarteProduit'
import { boutique, estCommandable, estPackshot, produitsLies, srcImage, trouverCategorie, trouverProduit } from '@/lib/catalogue'
import { lienWhatsApp, messageProduit } from '@/lib/whatsapp'
import { lienCommandeDirecte } from '@/lib/commandeDirecte'
import { cn } from '@/lib/utils'
import { usePanier } from '@/state/panier'
import { useFavoris } from '@/state/favoris'
import { useInterface } from '@/state/interface'
import { useAnimationsActives } from '@/state/animations'
import { Page404 } from '@/features/infos/Page404'
import type { Produit } from '@/lib/types'

/** cloneme: C-20 — galerie de la référence : carrés `--fond-2` rayon 20 px en grille 2 colonnes écart 12 px, vignettes 4 colonnes en dessous.
 *  H MODE : 1 photo → un grand carré ; 3 photos → la 1re sur deux colonnes. Clic = agrandir (fonction conservée). */
function Galerie({ produit }: { produit: Produit }) {
  const [zoom, setZoom] = useState<number | null>(null)
  const packshot = estPackshot(produit)
  const principales = produit.images.slice(0, 4)
  const autres = produit.images.slice(4)
  const pastille = produit.nouveau ? 'Nouveau' : produit.misEnAvant ? 'À la une' : null
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {principales.map((img, i) => (
          <button key={img.src} type="button" onClick={() => setZoom(i)} aria-label={`Agrandir : ${img.alt}`}
            className={cn('group relative aspect-square cursor-zoom-in overflow-hidden rounded-carte bg-fond-2', (principales.length === 1 || (principales.length === 3 && i === 0)) && 'col-span-2')}>
            {i === 0 && pastille && (
              <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-encre px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fond">
                <span className="anim-pouls h-1.5 w-1.5 rounded-full bg-accent" />{pastille}
              </span>
            )}
            <ImageProduit src={img.src} alt={img.alt} prioritaire={i === 0} packshot={packshot} className="absolute inset-0" tailles="(min-width: 768px) 30vw, 50vw" zoomSurvol />
            <span className="absolute bottom-3 right-3 z-[4] grid h-9 w-9 place-items-center rounded-full bg-fond/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100"><Maximize2 className="h-4 w-4" strokeWidth={1.5} /></span>
          </button>
        ))}
      </div>
      {autres.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {autres.map((img, i) => (
            <button key={img.src} type="button" onClick={() => setZoom(i + 4)} aria-label={`Agrandir : ${img.alt}`} className="relative aspect-square overflow-hidden rounded-xl bg-fond-2">
              <ImageProduit src={img.src} alt="" packshot={packshot} className="absolute inset-0" tailles="120px" />
            </button>
          ))}
        </div>
      )}
      <Modale ouvert={zoom !== null} onFermer={() => setZoom(null)} titre={produit.nom} large>
        {zoom !== null && (
          <div>
            <img src={srcImage(produit.images[zoom].src, 960)} alt={produit.images[zoom].alt} className={cn('mx-auto max-h-[70vh] w-auto', packshot && 'mix-blend-multiply')} />
            {produit.images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {produit.images.map((img, i) => (
                  <button key={img.src} type="button" onClick={() => setZoom(i)} aria-label={`Vue ${i + 1}`} aria-current={i === zoom}
                    className={cn('relative aspect-square w-14 overflow-hidden rounded-xl border bg-fond-2 transition-[opacity,border-color]', i === zoom ? 'border-encre' : 'border-transparent opacity-60')}>
                    <ImageProduit src={img.src} alt="" packshot={packshot} className="absolute inset-0" tailles="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modale>
    </div>
  )
}

const secondaire = 'flex w-full items-center justify-center gap-3 rounded-full border border-ligne-forte bg-fond-2 py-4 font-display text-[13px] uppercase tracking-[0.16em] text-encre transition-colors hover:bg-fond-3'

/** Bouton favori rond 48 px de la référence. */
function BoutonFavori({ actif, onClick, nom }: { actif: boolean; onClick: () => void; nom: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={actif} aria-label={actif ? `Retirer ${nom} des favoris` : `Ajouter ${nom} aux favoris`}
      className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-all', actif ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-encre hover:border-encre')}>
      <Heart className={cn('h-4 w-4', actif && 'fill-current')} strokeWidth={1.75} />
    </button>
  )
}

/** Tableau à filets de la référence : intitulé mono 11 px gris (140 px), valeur 14 px. */
function Tableau({ lignes }: { lignes: [string, ReactNode][] }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {lignes.map(([k, v]) => (
          <tr key={k} className="border-b border-ligne">
            <th scope="row" className="w-[140px] py-3 text-left align-top font-mono text-[11px] font-normal uppercase tracking-[0.18em] text-gris">{k}</th>
            <td className="py-3 text-[14px]">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function GuideTailles({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  return (
    <Modale ouvert={ouvert} onFermer={onFermer} titre="Guide des tailles">
      <p className="text-gris">Les mesures détaillées par modèle seront publiées prochainement.</p>
      <p className="mt-4 text-gris">En attendant, indiquez-nous votre taille habituelle sur WhatsApp : nous vous conseillons personnellement.</p>
      <BoutonExterne href={lienWhatsApp('Bonjour H MODE, j\'ai besoin d\'un conseil de taille.')} variante="contour" className="mt-8" icone={<IconeWhatsApp className="h-4 w-4" />}>Conseil taille</BoutonExterne>
    </Modale>
  )
}

export function PageProduit() {
  const { slug = '' } = useParams()
  const produit = trouverProduit(slug)
  const [coloris, setColoris] = useState<string | null>(null)
  const [taille, setTaille] = useState<string | null>(null)
  const [quantite, setQuantite] = useState(1)
  const [erreurTaille, setErreurTaille] = useState(false)
  const [guide, setGuide] = useState(false)
  const [barreVisible, setBarreVisible] = useState(false)
  const [onglet, setOnglet] = useState('description')
  const zoneAchat = useRef<HTMLDivElement>(null)
  const ajouter = usePanier(s => s.ajouter)
  const ouvrir = useInterface(s => s.ouvrir)
  const naviguer = useNavigate()
  const notifier = useNotifier()
  const favori = useFavoris(s => s.slugs.includes(slug))
  const basculerFavori = useFavoris(s => s.basculer)
  const animations = useAnimationsActives()

  useEffect(() => {
    setColoris(produit?.coloris[0]?.nom ?? null); setTaille(null); setQuantite(1); setErreurTaille(false)
  }, [produit])
  useEffect(() => {
    const el = zoneAchat.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setBarreVisible(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el); return () => io.disconnect()
  }, [produit])

  if (!produit) return <Page404 />
  const categorie = trouverCategorie(produit.categorie)
  const commandable = estCommandable(produit)
  const epuise = produit.disponibilite === 'epuise'

  const surAjout = () => {
    if (!commandable || !coloris) return
    if (!taille) { setErreurTaille(true); return }
    ajouter(produit.slug, coloris, taille, quantite)
    notifier({ ton: 'succes', message: <>« {produit.nom} » ajouté au panier.</> })
    ouvrir('panier')
  }
  // Commander directement : cette variante seule va au checkout, le panier n'est pas modifié.
  const surCommande = () => {
    if (!commandable || !coloris) return
    if (!taille) { setErreurTaille(true); return }
    naviguer(lienCommandeDirecte(produit.slug, coloris, taille, quantite))
  }
  const lienWA = lienWhatsApp(messageProduit(produit.nom, { coloris: coloris ?? undefined, taille: taille ?? undefined }))

  const etiquette = 'mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-gris'
  const caracteristiques: [string, ReactNode][] = [
    ['Marque', produit.marque], ['Catégorie', categorie?.nom ?? produit.categorie],
    ['Coloris', <span className="flex flex-wrap gap-2">{produit.coloris.map(c => <PastilleCouleur key={c.nom} nom={c.nom} hex={c.hex} />)}</span>],
    ['Tailles', produit.tailles.length ? produit.tailles.map(t => t.taille).join(' · ') : <AConfirmer />],
  ]
  const onglets: { id: string; libelle: string; contenu: ReactNode }[] = [
    { id: 'description', libelle: 'Description', contenu: <><p className="mb-6 text-[16px] leading-[1.7] text-gris">{produit.description}</p><Tableau lignes={caracteristiques.slice(0, 2)} /></> },
    { id: 'caracteristiques', libelle: 'Caractéristiques', contenu: <Tableau lignes={caracteristiques} /> },
    { id: 'matiere', libelle: 'Matière & entretien', contenu: <Tableau lignes={[['Matière', produit.matiere ?? <AConfirmer />], ['Entretien', produit.entretien ?? <AConfirmer />]]} /> },
    { id: 'livraison', libelle: 'Livraison & paiement', contenu: <Tableau lignes={[['Paiement', `${boutique.paiement}. Confirmation de chaque commande sur WhatsApp.`], ['Zones et délais', boutique.livraison.zones ?? <AConfirmer />]]} /> },
  ]
  const ongletActif = onglets.find(o => o.id === onglet) ?? onglets[0]

  return (
    <>
      {/* cloneme: P-03 — fiche produit de la référence : fil d'Ariane mono, galerie 1.2fr / infos 1fr écart 64 px, onglets, « Vous aimerez aussi ». */}
      <div className="min-h-screen pt-20">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-gris md:px-14">
          <Link to="/" className="hover:text-encre">Accueil</Link><span aria-hidden>/</span>
          <Link to="/boutique" className="hover:text-encre">Boutique</Link><span aria-hidden>/</span>
          {categorie && <><Link to={`/boutique/${categorie.slug}`} className="hover:text-encre">{categorie.nom}</Link><span aria-hidden>/</span></>}
          <span className="text-encre" aria-current="page">{produit.nom}</span>
        </nav>
        <div className="grid grid-cols-1 gap-8 px-5 py-6 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-14">
          <Galerie produit={produit} />

          <motion.div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start" initial={animations ? { opacity: 0, y: 16 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div>
              <p className="surtitre text-gris">{produit.marque}</p>
              <h1 className="font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em]">{produit.nom} <em aria-hidden className="contour-encre not-italic">/ {categorie?.nom ?? produit.categorie}</em></h1>
            </div>
            {produit.prixDH === null
              ? <p className="font-display text-[24px] uppercase tracking-[0.02em]">Prix sur demande</p>
              : <Prix prixDH={produit.prixDH} prixBarreDH={produit.prixBarreDH} className="text-[32px] [&_s]:text-[20px]" />}
            <p className="text-[15px] leading-[1.62] text-gris">{produit.description}</p>

            <div ref={zoneAchat} className="flex flex-col gap-6">
              <div>
                <p className={etiquette}>Couleur</p>
                <SelecteurColoris coloris={produit.coloris} valeur={coloris} onChange={setColoris} />
                {produit.aConfirmer.includes('disponibilité des coloris') && <p className="mt-3 text-[13px] text-gris">Coloris photographiés en boutique, disponibilité à confirmer.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className={etiquette}>Taille — {taille ? <strong className="font-normal text-encre">{taille}</strong> : 'Choisir'}</p>
                  {produit.tailles.length > 0 && <button type="button" onClick={() => setGuide(true)} className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] underline underline-offset-4 hover:text-danger">Guide des tailles</button>}
                </div>
                {produit.tailles.length ? (
                  <SelecteurTaille tailles={produit.tailles} valeur={taille} erreur={erreurTaille} onChange={t => { setTaille(t); setErreurTaille(false) }} />
                ) : <AConfirmer>Tailles bientôt renseignées — demandez la vôtre sur WhatsApp</AConfirmer>}
                {erreurTaille && <p role="alert" className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-danger">Veuillez choisir une taille.</p>}
              </div>

              {commandable ? (
                <>
                  <div className="flex items-center gap-3">
                    <Quantite valeur={quantite} onChange={setQuantite} />
                    {/* Référence : grisé (fond filet, texte gris) tant qu'aucune taille n'est choisie. `aria-disabled` plutôt que `disabled` : le clic affiche « Veuillez choisir une taille ». */}
                    <button type="button" onClick={surAjout} aria-disabled={!taille}
                      className={cn('flex-1 rounded-full py-4 font-display text-[13px] uppercase tracking-[0.16em] transition-all',
                        taille ? 'bg-encre text-fond hover:bg-encre-douce' : 'cursor-not-allowed bg-ligne text-gris')}>
                      Ajouter au panier{produit.prixDH !== null && <span aria-hidden> — {formatDH(produit.prixDH * quantite)}</span>}
                    </button>
                    <BoutonFavori actif={favori} onClick={() => basculerFavori(produit.slug)} nom={produit.nom} />
                  </div>
                  {/* Référence : « Acheter · Paiement à la livraison », libellé « Choisir une taille » et opacité 40 % tant que la taille manque */}
                  <button type="button" onClick={surCommande} aria-disabled={!taille} className={cn(secondaire, !taille && 'cursor-not-allowed opacity-40')}>
                    {taille ? 'Commander · Paiement à la livraison' : 'Choisir une taille'}
                  </button>
                  <a href={lienWA} target="_blank" rel="noopener noreferrer" className={secondaire}><IconeWhatsApp className="h-4 w-4 text-whatsapp" />Commander sur WhatsApp</a>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <a href={lienWA} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-3 rounded-full bg-encre py-4 font-display text-[13px] uppercase tracking-[0.16em] text-fond transition-colors hover:bg-encre-douce">
                      <IconeWhatsApp className="h-4 w-4 text-whatsapp" />{epuise ? 'Être prévenu sur WhatsApp' : 'Demander prix et disponibilité'}
                    </a>
                    <BoutonFavori actif={favori} onClick={() => basculerFavori(produit.slug)} nom={produit.nom} />
                  </div>
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-gris">{epuise ? 'Cette pièce est épuisée.' : 'Prix bientôt affiché en ligne · réponse personnelle sur WhatsApp'}</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* cloneme: C-21 — onglets de la référence : mono 12 px .18em, actif souligné 2 px encre, contenu `py-10` largeur 640 px, tableau à filets. */}
        <div className="mt-8 px-5 md:px-14">
          <div role="tablist" aria-label="Informations produit" className="defilement-masque flex gap-6 overflow-x-auto border-b border-ligne">
            {onglets.map(o => (
              <button key={o.id} type="button" role="tab" aria-selected={o.id === ongletActif.id} aria-controls={`onglet-${o.id}`} onClick={() => setOnglet(o.id)}
                className={cn('-mb-px whitespace-nowrap border-b-2 py-4 font-mono text-[12px] uppercase tracking-[0.18em] transition-colors', o.id === ongletActif.id ? 'border-encre text-encre' : 'border-transparent text-gris hover:text-encre')}>{o.libelle}</button>
            ))}
          </div>
          <div id={`onglet-${ongletActif.id}`} role="tabpanel" className="py-10"><div className="max-w-[640px]">{ongletActif.contenu}</div></div>
        </div>

        <section className="px-5 pb-16 pt-6 md:px-14">
          <h2 className="mb-8 font-display text-[32px] uppercase tracking-[-0.01em]">Vous aimerez aussi</h2>
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {produitsLies(produit).map((p, i) => <li key={p.slug}><Revelation delai={i * 0.06}><CarteProduit produit={p} /></Revelation></li>)}
          </ul>
        </section>
      </div>

      {/* Barre d'achat collante (mobile), rendue dans <body> : un ancêtre transformé (transition de page) casserait position: fixed */}
      {createPortal(<div className={cn('fixed inset-x-0 bottom-[var(--demo-h)] z-40 border-t border-ligne bg-[var(--voile-entete)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-[18px] pt-3 backdrop-blur transition-transform duration-500 ease-maison md:hidden', barreVisible ? 'translate-y-0' : 'translate-y-full')}
        {...(!barreVisible && { inert: '', 'aria-hidden': true })}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate font-display text-[15px] uppercase">{produit.nom}</p><Prix prixDH={produit.prixDH} /></div>
          {commandable
            ? <Bouton taille="sm" onClick={() => { zoneAchat.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); if (taille) surAjout(); else setErreurTaille(true) }}>Ajouter</Bouton>
            : <BoutonExterne href={lienWA} taille="sm">WhatsApp</BoutonExterne>}
        </div>
      </div>, document.body)}
      <GuideTailles ouvert={guide} onFermer={() => setGuide(false)} />
    </>
  )
}
