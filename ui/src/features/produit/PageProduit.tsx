import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Maximize2 } from 'lucide-react'
import {
  AConfirmer, Accordeon, Bouton, BoutonExterne, Cadre, FilAriane, IconeWhatsApp, ImageProduit, Modale, Prix, Quantite,
  Revelation, SelecteurColoris, SelecteurTaille, useNotifier,
} from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { boutique, estCommandable, estPackshot, produitsLies, srcImage, trouverCategorie, trouverProduit } from '@/lib/catalogue'
import { lienWhatsApp, messageProduit } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { usePanier } from '@/state/panier'
import { useFavoris } from '@/state/favoris'
import { useInterface } from '@/state/interface'
import { useAnimationsActives } from '@/state/animations'
import { Page404 } from '@/features/infos/Page404'
import type { Produit } from '@/lib/types'

function Galerie({ produit }: { produit: Produit }) {
  const [zoom, setZoom] = useState<number | null>(null)
  const [actif, setActif] = useState(0)
  const piste = useRef<HTMLDivElement>(null)
  const packshot = estPackshot(produit)
  const surDefilement = () => {
    const el = piste.current
    if (el) setActif(Math.round(el.scrollLeft / el.clientWidth))
  }
  return (
    <div>
      {/* Mobile : glisser */}
      <div className="relative lg:hidden">
        <div ref={piste} onScroll={surDefilement} className="defilement-masque flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
          {produit.images.map((img, i) => (
            <button key={img.src} type="button" onClick={() => setZoom(i)} className="w-full shrink-0 snap-center p-2" aria-label={`Agrandir : ${img.alt}`}>
              <Cadre className="aspect-[4/5]">
                <ImageProduit src={img.src} alt={img.alt} prioritaire={i === 0} packshot={packshot} className="absolute inset-0" tailles="100vw" />
              </Cadre>
            </button>
          ))}
        </div>
        {produit.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden>
            {produit.images.map((_, i) => <span key={i} className={cn('h-[3px] rounded-full bg-encre transition-all duration-500', i === actif ? 'w-6' : 'w-2 opacity-30')} />)}
          </div>
        )}
      </div>
      {/* Desktop : images empilées */}
      <div className="hidden gap-8 lg:grid">
        {produit.images.map((img, i) => (
          <button key={img.src} type="button" onClick={() => setZoom(i)} className="group relative cursor-zoom-in" aria-label={`Agrandir : ${img.alt}`}>
            <Cadre className="aspect-[4/5]">
              <ImageProduit src={img.src} alt={img.alt} prioritaire={i === 0} packshot={packshot} className="absolute inset-0" tailles="55vw" zoomSurvol />
            </Cadre>
            <span className="absolute bottom-7 right-7 z-[4] grid h-10 w-10 place-items-center rounded-full bg-nacre/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><Maximize2 className="h-4 w-4" strokeWidth={1.25} /></span>
          </button>
        ))}
      </div>
      <Modale ouvert={zoom !== null} onFermer={() => setZoom(null)} titre={produit.nom} large>
        {zoom !== null && (
          <div>
            <img src={srcImage(produit.images[zoom].src, 960)} alt={produit.images[zoom].alt} className={cn('mx-auto max-h-[70vh] w-auto', packshot && 'mix-blend-multiply')} />
            {produit.images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {produit.images.map((img, i) => (
                  <button key={img.src} type="button" onClick={() => setZoom(i)} aria-label={`Vue ${i + 1}`} aria-current={i === zoom}
                    className={cn('w-14 outline outline-1 outline-offset-2 transition-[opacity,outline-color]', i === zoom ? 'outline-or' : 'outline-transparent opacity-60')}>
                    <Cadre compact className="aspect-[4/5]"><ImageProduit src={img.src} alt="" packshot={packshot} className="absolute inset-0" tailles="56px" /></Cadre>
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
  const zoneAchat = useRef<HTMLDivElement>(null)
  const ajouter = usePanier(s => s.ajouter)
  const ouvrir = useInterface(s => s.ouvrir)
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
  const lienWA = lienWhatsApp(messageProduit(produit.nom, { coloris: coloris ?? undefined, taille: taille ?? undefined }))

  return (
    <>
      <div className="conteneur pt-[calc(var(--nav-h)+1.5rem)] lg:pt-28">
        <div className="mb-6 lg:mb-10"><FilAriane elements={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Boutique', vers: '/boutique' }, ...(categorie ? [{ libelle: categorie.nom, vers: `/boutique/${categorie.slug}` }] : []), { libelle: produit.nom }]} /></div>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
          <div className="-mx-4 sm:mx-0"><Galerie produit={produit} /></div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <motion.div initial={animations ? { opacity: 0, y: 16 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <p className="label text-bronze">{produit.marque}</p>
              <h1 className="titre-1 mt-3">{produit.nom}</h1>
              <div className="mt-5"><Prix prixDH={produit.prixDH} prixBarreDH={produit.prixBarreDH} grand /></div>

              <div ref={zoneAchat} className="mt-10 flex flex-col gap-8 border-t border-ligne pt-8">
                <div>
                  <p className="label mb-3 text-gris">Coloris — <span className="capitalize text-encre">{coloris}</span></p>
                  <SelecteurColoris coloris={produit.coloris} valeur={coloris} onChange={setColoris} />
                  {produit.aConfirmer.includes('disponibilité des coloris') && <p className="mt-3 text-[13px] text-gris">Coloris photographiés en boutique, disponibilité à confirmer.</p>}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="label text-gris">Taille{taille && <> — <span className="text-encre">{taille}</span></>}</p>
                    {produit.tailles.length > 0 && <button type="button" onClick={() => setGuide(true)} className="label underline underline-offset-4 hover:text-bronze">Guide des tailles</button>}
                  </div>
                  {produit.tailles.length ? (
                    <SelecteurTaille tailles={produit.tailles} valeur={taille} erreur={erreurTaille} onChange={t => { setTaille(t); setErreurTaille(false) }} />
                  ) : <AConfirmer>Tailles bientôt renseignées — demandez la vôtre sur WhatsApp</AConfirmer>}
                  {erreurTaille && <p role="alert" className="mt-3 text-[13px] text-erreur">Veuillez choisir une taille.</p>}
                </div>

                {commandable ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <Quantite valeur={quantite} onChange={setQuantite} />
                      <Bouton onClick={surAjout} className="flex-1" taille="md">Ajouter au panier</Bouton>
                    </div>
                    <BoutonExterne href={lienWA} variante="whatsapp" plein_largeur icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Commander sur WhatsApp</BoutonExterne>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <BoutonExterne href={lienWA} plein_largeur icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>
                      {epuise ? 'Être prévenu sur WhatsApp' : 'Demander prix et disponibilité'}
                    </BoutonExterne>
                    <p className="text-center text-[13px] text-gris">{epuise ? 'Cette pièce est épuisée.' : 'Prix bientôt affiché en ligne. Réponse personnelle sur WhatsApp.'}</p>
                  </div>
                )}

                <button type="button" onClick={() => basculerFavori(produit.slug)} aria-pressed={favori} className="label inline-flex items-center gap-2 self-start hover:text-bronze">
                  <Heart className={cn('h-4 w-4', favori && 'fill-bronze text-bronze')} strokeWidth={1.25} />{favori ? 'Dans vos favoris' : 'Ajouter aux favoris'}
                </button>
              </div>

              <div className="mt-10 border-t border-ligne">
                <Accordeon titre="Description" ouvertParDefaut>{produit.description}</Accordeon>
                <Accordeon titre="Matière & entretien">
                  <p>Matière : {produit.matiere ?? <AConfirmer />}</p>
                  <p className="mt-2">Entretien : {produit.entretien ?? <AConfirmer />}</p>
                </Accordeon>
                <Accordeon titre="Livraison & paiement">
                  <p>{boutique.paiement}. Confirmation de chaque commande sur WhatsApp.</p>
                  <p className="mt-2">Zones, délais et frais : {boutique.livraison.zones ?? <AConfirmer />}</p>
                </Accordeon>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="conteneur mt-28">
        <Revelation className="mb-10"><p className="label mb-3 text-bronze">Vous aimerez aussi</p><h2 className="titre-2">Dans le même esprit</h2></Revelation>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {produitsLies(produit).map((p, i) => <li key={p.slug}><Revelation delai={i * 0.06}><CarteProduit produit={p} /></Revelation></li>)}
        </ul>
      </section>

      {/* Barre d'achat collante (mobile), rendue dans <body> : un ancêtre transformé (transition de page) casserait position: fixed */}
      {createPortal(<div className={cn('fixed inset-x-0 bottom-[var(--demo-h)] z-40 border-t border-ligne bg-nacre/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-500 ease-maison lg:hidden', barreVisible ? 'translate-y-0' : 'translate-y-full')}
        {...(!barreVisible && { inert: '', 'aria-hidden': true })}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate font-display text-[17px]">{produit.nom}</p><Prix prixDH={produit.prixDH} /></div>
          {commandable
            ? <Bouton taille="sm" onClick={() => { zoneAchat.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); if (taille) surAjout(); else setErreurTaille(true) }}>Ajouter</Bouton>
            : <BoutonExterne href={lienWA} taille="sm">WhatsApp</BoutonExterne>}
        </div>
      </div>, document.body)}
      <GuideTailles ouvert={guide} onFermer={() => setGuide(false)} />
    </>
  )
}
