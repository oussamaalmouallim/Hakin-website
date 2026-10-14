import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Banknote, Crown, MessageCircle } from 'lucide-react'
import { BoutonExterne, BoutonLien, IconeFacebook, IconeInstagram, ImageProduit, Monogramme, Revelation } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { SeasonCard } from '@/components/lightswind/seasonal-hover-cards'
import { boutique, collections, produits, produitsDeCollection } from '@/lib/catalogue'
import { lienWhatsApp } from '@/lib/whatsapp'
import { ScrollReveal } from '@/components/lightswind/scroll-reveal'
import { MarqueeMenu } from '@/components/lightswind/marquee-menu'
import { LoopingWords } from '@/components/lightswind/looping-words'
import { CountUp } from '@/components/lightswind/count-up'
import { ShinyText } from '@/components/lightswind/shiny-text'
import { conteneurCascade, elementApparition, EASE_MAISON, useMedia } from '@/lib/animations'
import { useAnimationsActives } from '@/state/animations'

function Heros() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yImage = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const opaciteTexte = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const actives = useAnimationsActives()
  // Parallaxe et fondu liés au défilement : écran large seulement (en mobile, la barre d'adresse fait varier la hauteur).
  const parallaxe = useMedia('(min-width: 640px)') && actives
  return (
    <section ref={ref} className="relative flex flex-col overflow-hidden bg-gradient-to-b from-sable-200 via-sable-100 to-nacre sm:block sm:min-h-[100svh]">
      {/* Arche de lumière (rappel de la maquette) */}
      <div aria-hidden className="absolute -right-[20%] top-[-20%] h-[120%] w-[90%] rounded-t-full bg-gradient-to-b from-neige/45 to-transparent blur-2xl sm:-right-[10%] sm:w-[60%]" />
      <motion.div style={parallaxe ? { y: yImage } : undefined} className="relative order-2 mx-auto h-[62svh] w-[88%] sm:absolute sm:bottom-0 sm:right-0 sm:order-none sm:mx-0 sm:h-[88%] sm:w-[46%] lg:w-[38%]">
        <motion.img src="/images/campagne/hero-modele-640.webp" alt="Homme en costume de lin écru, lunettes de soleil, adossé à un mur de pierre claire"
          {...{ fetchpriority: 'high' }} className="masque-heros h-full w-full object-cover object-top"
          initial={actives ? { opacity: 0, scale: 1.06 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: EASE_MAISON }} />
      </motion.div>

      <motion.div style={parallaxe ? { opacity: opaciteTexte } : undefined} variants={conteneurCascade} initial={actives ? 'cache' : false} animate="visible"
        className="conteneur relative z-10 order-1 grid pb-12 pt-28 sm:min-h-[100svh] sm:grid-rows-[1fr_auto] sm:pb-10 lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-1 lg:items-center lg:pb-0">
        <motion.div variants={elementApparition} className="hidden lg:block">
          <p className="font-display text-[22px] uppercase italic leading-snug tracking-[0.18em] text-encre/80">Plus qu'un style,<br />une attitude.</p>
          <span className="mt-6 block h-px w-24 bg-encre/50" />
        </motion.div>

        <div className="flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center">
          <motion.div variants={elementApparition}><Monogramme className="h-24 sm:h-32 lg:h-40" /></motion.div>
          <motion.h1 variants={elementApparition} className="mt-4 font-display text-[clamp(3rem,8vw,6.5rem)] font-medium uppercase leading-none tracking-[0.18em]">H Mode</motion.h1>
          <motion.p variants={elementApparition} className="filet-etoile mt-6 text-[14px]" aria-hidden>✦</motion.p>
          <motion.p variants={elementApparition} className="label-large mt-4 text-encre/70">Style · Quality · You</motion.p>
          <motion.p variants={elementApparition} className="mt-8 max-w-sm font-display text-[20px] italic text-encre/80 lg:hidden">Plus qu'un style, une attitude.</motion.p>
          <motion.div variants={elementApparition} className="mt-10 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-start lg:justify-center">
            <BoutonLien to="/boutique">Découvrir la boutique</BoutonLien>
            <BoutonLien to="/collections" variante="contour">Les collections</BoutonLien>
          </motion.div>
        </div>
        <div className="hidden lg:block" />
      </motion.div>

      <a href="#selection" className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-encre/70 lg:flex">
        <span className="label">Découvrir</span>
        <ArrowDown className="h-4 w-4 animate-descendre" strokeWidth={1.25} />
      </a>
      <p aria-hidden className="label absolute right-5 top-1/2 hidden -translate-y-1/2 whitespace-nowrap text-encre/45 [writing-mode:vertical-rl] xl:block">H Mode — {boutique.ville}</p>
    </section>
  )
}

function Collections() {
  return (
    <section className="conteneur pb-24 pt-16 sm:pt-20 lg:pb-36 lg:pt-24">
      <Revelation className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div><p className="label mb-4 text-bronze">Collections</p><h2 className="titre-1 max-w-xl equilibre">Deux univers, une même exigence</h2></div>
        <Link to="/collections" className="lien-souligne label">Toutes les collections <ArrowRight className="h-3.5 w-3.5" /></Link>
      </Revelation>
      <div className="mx-auto grid max-w-sm gap-16 md:max-w-3xl md:grid-cols-2 md:gap-16 lg:gap-24">
        {collections.map((c, i) => (
          <Revelation key={c.slug} delai={i * 0.12} className={i === 1 ? 'md:mt-24' : ''}>
            <SeasonCard grand className="aspect-[4/5]" vers={`/collections/${c.slug}`} labelLien={`Collection ${c.nom}`}
              image={<ImageProduit src={c.image} alt="" zoomSurvol className="absolute inset-0" tailles="(min-width: 768px) 40vw, 100vw" />}
              titre={c.nom}
              details={<span className="label inline-flex items-center gap-3 text-nacre/90">Découvrir la collection <ArrowRight className="h-3.5 w-3.5 text-or-clair" strokeWidth={1.25} /></span>} />
            <p className="label mt-5 text-bronze">{produitsDeCollection(c.slug).length} pièces</p>
            <p className="mt-2 max-w-xs text-gris">{c.accroche}</p>
          </Revelation>
        ))}
      </div>
    </section>
  )
}

function Manifeste() {
  return (
    <section className="conteneur pt-16 text-center sm:pt-20 lg:pt-24">
      <p className="label mb-10 text-bronze">Notre regard</p>
      <ScrollReveal className="mx-auto max-w-5xl text-[clamp(1.9rem,4.4vw,3.6rem)] leading-[1.15] equilibre">
        Les signatures des grandes maisons, choisies avec soin et conseillées personnellement, pour un style qui vous ressemble.
      </ScrollReveal>
      <p className="filet-etoile mt-12 justify-center" aria-hidden>✦</p>
    </section>
  )
}

/** Maisons présentes au catalogue, de la plus représentée à la moins représentée (nombres réels). */
const maisons = () => {
  const n = new Map<string, number>()
  for (const p of produits) n.set(p.marque, (n.get(p.marque) ?? 0) + 1)
  return [...n].sort((a, b) => b[1] - a[1]).map(([nom, total]) => ({ nom, total }))
}

function Maisons() {
  const elements = maisons().map(({ nom, total }) => ({
    cle: nom, libelle: nom, detail: `${total} pièce${total > 1 ? 's' : ''}`, vers: `/boutique?marque=${encodeURIComponent(nom)}`,
  }))
  return (
    <section className="conteneur py-24 lg:py-32">
      <Revelation className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div><p className="label mb-4 text-bronze">Les maisons</p><h2 className="titre-1">Par signature</h2></div>
        <p className="label text-gris">{elements.length} maisons</p>
      </Revelation>
      <MarqueeMenu elements={elements} />
    </section>
  )
}

function Selection() {
  const vedettes = produits.filter(p => p.misEnAvant)
  const piste = useRef<HTMLDivElement>(null)
  const [bornes, setBornes] = useState({ debut: true, fin: false })
  const mesurer = () => {
    const el = piste.current
    if (el) setBornes({ debut: el.scrollLeft < 8, fin: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }
  useEffect(() => {
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [])
  const defiler = (sens: 1 | -1) => piste.current?.scrollBy({ left: sens * piste.current.clientWidth * 0.8, behavior: 'smooth' })
  const fleche = 'grid h-12 w-12 place-items-center rounded-full border border-encre/20 transition-all duration-500 ease-maison enabled:hover:bg-encre enabled:hover:text-nacre disabled:opacity-30'
  return (
    <section id="selection" className="scroll-mt-24 bg-sable-50 py-24 lg:py-32">
      <div className="conteneur">
        <Revelation className="mb-12 flex items-end justify-between gap-6">
          <div><p className="label mb-4 text-bronze">La sélection</p><h2 className="titre-1">Pièces choisies</h2></div>
          <div className="flex items-center gap-8">
            <Link to="/boutique" className="lien-souligne label hidden sm:inline-flex">Toute la boutique <ArrowRight className="h-3.5 w-3.5" /></Link>
            <div className="hidden gap-2 md:flex">
              <button type="button" className={fleche} onClick={() => defiler(-1)} disabled={bornes.debut} aria-label="Pièces précédentes"><ArrowLeft className="h-4 w-4" strokeWidth={1.25} /></button>
              <button type="button" className={fleche} onClick={() => defiler(1)} disabled={bornes.fin} aria-label="Pièces suivantes"><ArrowRight className="h-4 w-4" strokeWidth={1.25} /></button>
            </div>
          </div>
        </Revelation>
      </div>
      <div ref={piste} onScroll={mesurer} role="region" aria-label="Pièces choisies, défilement horizontal" tabIndex={0}
        className="defilement-masque mx-auto flex max-w-site snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto overscroll-x-contain px-4 pb-6 pt-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10 [&>*]:snap-start">
        {vedettes.map((p, i) => (
          <Revelation key={p.slug} delai={i * 0.08} className="w-[56vw] shrink-0 sm:w-[32vw] lg:w-[20vw] xl:w-[17vw]"><CarteProduit produit={p} /></Revelation>
        ))}
        <Link to="/boutique" className="group flex aspect-[4/5] w-[56vw] shrink-0 flex-col items-center justify-center gap-4 self-start rounded-[6px] bg-encre text-nacre shadow-carte transition-transform duration-700 ease-maison hover:-translate-y-1 sm:w-[32vw] lg:w-[20vw] xl:w-[17vw]">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-or/50 text-or-clair transition-transform duration-700 ease-maison group-hover:translate-x-1"><ArrowRight className="h-5 w-5" strokeWidth={1.25} /></span>
          <span className="label">Voir les {produits.length} pièces</span>
        </Link>
      </div>
    </section>
  )
}

function Editorial() {
  const liste = maisons()
  const stats = [
    { valeur: liste.length, libelle: 'maisons' },
    { valeur: produits.length, libelle: 'pièces' },
  ]
  return (
    <section className="conteneur grid items-center gap-16 py-24 lg:grid-cols-2 lg:gap-24 lg:py-36">
      <Revelation className="mx-auto w-full max-w-md">
        {/* Écrin : les maisons de la sélection défilent une à une */}
        <div className="relative flex aspect-[4/5] flex-col items-center justify-center rounded-[6px] bg-encre px-4 text-center shadow-flottant sm:px-6">
          <Monogramme className="h-10" />
          <p className="label mt-8 text-or">La sélection</p>
          <LoopingWords words={liste.map(m => m.nom)} fond="#0E0E0D" classeMot="text-nacre" className="mt-4 text-[clamp(1.4rem,6.4vw,2.75rem)]" />
          <p className="filet-etoile mt-6 text-or" aria-hidden>✦</p>
          <p className="mt-4 font-display text-[18px] italic text-nacre/70">{boutique.ville.split(',')[0]}</p>
        </div>
      </Revelation>
      <Revelation>
        <p className="label mb-5 text-bronze">La Maison</p>
        <h2 className="titre-1 equilibre">L'élégance, choisie avec soin</h2>
        <p className="mt-8 max-w-md text-[17px] text-gris">
          H MODE réunit à {boutique.ville.split(',')[0]} une sélection de pièces des grandes maisons, présentées et conseillées personnellement.
        </p>
        <dl className="mt-10 grid max-w-md grid-cols-2 divide-x divide-ligne border-y border-ligne">
          {stats.map(st => (
            <div key={st.libelle} className="flex flex-col gap-2 py-6 first:pr-6 last:pl-6">
              <dd className="font-display text-[clamp(2.75rem,5vw,3.75rem)] leading-none text-encre"><CountUp value={st.valeur} /></dd>
              <dt className="label order-first text-gris">{st.libelle}</dt>
            </div>
          ))}
        </dl>
        <BoutonLien to="/maison" variante="texte" className="mt-10">Découvrir la maison <ArrowRight className="h-3.5 w-3.5" /></BoutonLien>
      </Revelation>
    </section>
  )
}

const ENGAGEMENTS = [
  { Icone: Crown, titre: 'Revendeur agréé', texte: 'Des pièces issues des maisons dont nous sommes revendeur.' },
  { Icone: MessageCircle, titre: 'Conseil sur WhatsApp', texte: 'Une question de taille ou de disponibilité ? Nous répondons personnellement.' },
  { Icone: Banknote, titre: boutique.paiement, texte: 'Vous réglez à la réception de votre commande.' },
]

function Engagements() {
  return (
    <section className="border-y border-ligne">
      <div className="conteneur grid divide-y divide-ligne md:grid-cols-3 md:divide-x md:divide-y-0">
        {ENGAGEMENTS.map(({ Icone, titre, texte }, i) => (
          <Revelation key={titre} delai={i * 0.1} className="flex items-start gap-5 py-8 md:flex-col md:items-center md:gap-4 md:px-6 md:py-14 md:text-center">
            <Icone className="mt-1 h-6 w-6 shrink-0 text-bronze md:mt-0" strokeWidth={1} aria-hidden />
            <div className="md:flex md:flex-col md:items-center md:gap-4">
              <h3 className="titre-3">{titre}</h3>
              <p className="mt-1.5 max-w-xs text-[15px] text-gris md:mt-0">{texte}</p>
            </div>
          </Revelation>
        ))}
      </div>
    </section>
  )
}

function Reseaux() {
  const [ouvert, setOuvert] = useState(false)
  const actives = useAnimationsActives()
  const reseaux = [
    { nom: 'Instagram', url: boutique.instagram.url, Icone: IconeInstagram },
    { nom: 'Facebook', url: boutique.facebook.url, Icone: IconeFacebook },
  ]
  return (
    <section className="conteneur py-24 text-center lg:py-36">
      <Revelation className="flex flex-col items-center">
        <p className="label text-bronze">Suivre la Maison</p>
        <div className="mt-10 flex w-full items-center justify-center gap-6 sm:gap-10">
          <span aria-hidden className="h-px max-w-[160px] flex-1 bg-gradient-to-r from-transparent to-or/60" />
          <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-controls="reseaux-maison"
            className="group rounded-sm outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-bronze">
            <span className="sr-only">H MODE — afficher nos réseaux sociaux</span>
            <ShinyText className="font-display text-[clamp(2.75rem,9vw,6.5rem)] font-medium uppercase leading-none tracking-[0.22em] [margin-right:-0.22em]">H Mode</ShinyText>
          </button>
          <span aria-hidden className="h-px max-w-[160px] flex-1 bg-gradient-to-l from-transparent to-or/60" />
        </div>
        <p className="mt-6 max-w-sm text-gris">Nouveautés, arrivages et coulisses de la boutique.</p>
        <div id="reseaux-maison" className="mt-10 min-h-[52px]">
          <AnimatePresence initial={false} mode="wait">
            {ouvert ? (
              <motion.ul key="liens" className="flex items-center gap-6 sm:gap-10"
                initial={actives ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5, ease: EASE_MAISON }}>
                {reseaux.map(({ nom, url, Icone }, i) => (
                  <li key={nom} className="flex items-center gap-6 sm:gap-10">
                    {i > 0 && <span aria-hidden className="text-[11px] text-or">✦</span>}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="lien-souligne label inline-flex items-center gap-3 py-3 text-encre">
                      <Icone className="h-4 w-4" />{nom}<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                    </a>
                  </li>
                ))}
              </motion.ul>
            ) : (
              <motion.p key="invite" className="label py-4 text-gris" initial={actives ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Cliquez sur le nom de la Maison pour nous suivre
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Revelation>
    </section>
  )
}

function ContactRapide() {
  return (
    <section className="conteneur">
      <Revelation className="relative overflow-hidden bg-encre px-6 py-20 text-center text-nacre sm:px-16">
        <Monogramme className="mx-auto h-14 opacity-90" />
        <h2 className="titre-1 mx-auto mt-8 max-w-3xl equilibre">Une pièce en tête ? Parlons-en.</h2>
        <p className="mx-auto mt-5 max-w-md text-nacre/70">Taille, coloris, disponibilité : écrivez-nous, nous vous répondons personnellement.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BoutonExterne href={lienWhatsApp('Bonjour H MODE, je cherche une pièce.')} variante="clair">Écrire sur WhatsApp</BoutonExterne>
          <BoutonLien to="/contact" variante="contour-clair">Autres moyens de contact</BoutonLien>
        </div>
      </Revelation>
    </section>
  )
}

export function PageAccueil() {
  return (
    <>
      <Heros />
      <Manifeste />
      <Collections />
      <Maisons />
      <Selection />
      <Editorial />
      <Engagements />
      <Reseaux />
      <ContactRapide />
    </>
  )
}
