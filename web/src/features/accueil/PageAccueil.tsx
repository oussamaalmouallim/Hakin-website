import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, Banknote, MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react'
import { BoutonLien, IconeFacebook, IconeInstagram, IconeWhatsApp, Monogramme, Revelation, styleBouton } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { boutique, categoriesActives, produits, srcImage, srcsetImage } from '@/lib/catalogue'
import { lienWhatsApp } from '@/lib/whatsapp'
import { LoopingWords } from '@/components/lightswind/looping-words'
import { CountUp } from '@/components/lightswind/count-up'
import { conteneurCascade, elementApparition, EASE_MAISON, useMedia } from '@/lib/animations'
import { useAnimationsActives } from '@/state/animations'
import { BandeauDefilant } from '@/components/Ambiance'

/** cloneme: C-13 — héros H MODE conservé (exception demandée), ré-habillé : titre Archivo Black, surtitre mono à filet, accroche en creux, boutons pilule. */
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
      {/* Grand écran : la scène entière en fond, nette sur le personnage */}
      <div aria-hidden className="absolute inset-0 hidden lg:block">
        <motion.img src="/images/campagne/hero-scene-1920.webp"
          srcSet="/images/campagne/hero-scene-1280.webp 1280w, /images/campagne/hero-scene-1920.webp 1920w, /images/campagne/hero-scene-2560.webp 2560w"
          sizes="100vw" alt="" {...{ fetchpriority: 'high' }} className="h-full w-full object-cover object-[62%_center]"
          initial={actives ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 1.6, ease: EASE_MAISON }} />
      </div>
      {/* Flou dégradé : fort derrière le texte, il s'efface en allant vers le personnage */}
      <div aria-hidden className="flou-heros pointer-events-none absolute inset-0 hidden backdrop-blur-[10px] lg:block" />
      {/* Voile nacré léger pour la lisibilité du texte, et fondu vers la section suivante */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-nacre/50 via-nacre/20 via-45% to-transparent to-65% lg:block" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-6 bg-gradient-to-b from-transparent to-nacre/70 lg:block" />

      {/* Mobile et tablette : arche de lumière + portrait du modèle */}
      <div aria-hidden className="absolute -right-[20%] top-[-20%] h-[120%] w-[90%] rounded-t-full bg-gradient-to-b from-neige/45 to-transparent blur-2xl sm:-right-[10%] sm:w-[60%] lg:hidden" />
      <motion.div style={parallaxe ? { y: yImage } : undefined} className="relative order-2 mx-auto h-[62svh] w-[88%] sm:absolute sm:bottom-0 sm:right-0 sm:order-none sm:mx-0 sm:h-[88%] sm:w-[46%] lg:hidden">
        <motion.img src="/images/campagne/hero-modele-640.webp" srcSet="/images/campagne/hero-modele-640.webp 640w, /images/campagne/hero-modele-1280.webp 1060w"
          sizes="(min-width: 640px) 46vw, 88vw" alt="Homme en veste en jean et sweat à capuche écru, lunettes de soleil, assis sur un muret"
          className="masque-heros h-full w-full object-cover object-top"
          initial={actives ? { opacity: 0, scale: 1.06 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: EASE_MAISON }} />
      </motion.div>

      <motion.div style={parallaxe ? { opacity: opaciteTexte } : undefined} variants={conteneurCascade} initial={actives ? 'cache' : false} animate="visible"
        className="conteneur relative z-10 order-1 grid pb-12 pt-28 sm:min-h-[100svh] sm:grid-rows-[1fr_auto] sm:pb-10 lg:grid-cols-[1fr_auto_1.8fr] lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-0 lg:pt-16">
        {/* Colonne vide : garde le bloc central à sa place d'origine (l'accroche est maintenant centrée sous le nom) */}
        <div className="hidden lg:block" />

        <div className="flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center">
          <motion.div variants={elementApparition}><Monogramme className="h-24 sm:h-32 lg:h-24 xl:h-32 2xl:h-40" /></motion.div>
          <motion.h1 variants={elementApparition} className="mt-4 font-display text-[clamp(3rem,9vw,7rem)] uppercase leading-[0.88] tracking-[-0.025em] lg:text-[clamp(3.25rem,6.4vw,6.5rem)]">H Mode</motion.h1>
          <motion.p variants={elementApparition} className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-encre/70">Style · Quality · You</motion.p>
          {/* Signature centrée sous le nom : lieu entre deux filets, puis l'accroche (ligne pleine + ligne en creux) */}
          <motion.div variants={elementApparition} className="mt-8 flex flex-col items-center sm:items-start lg:mt-6 lg:items-center xl:mt-8">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-encre/70">
              <span aria-hidden className="h-px w-8 bg-current" />Casablanca<span aria-hidden className="h-px w-8 bg-current" />
            </p>
            <p className="mt-3 font-display text-[clamp(1.4rem,2.3vw,2.1rem)] uppercase leading-[1.02] tracking-[-0.01em]">Le casual,<br /><span className="contour-encre italic">une autre élégance.</span></p>
          </motion.div>
          <motion.div variants={elementApparition} className="mt-10 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-start lg:mt-7 lg:justify-center xl:mt-10">
            <BoutonLien to="/boutique" taille="lg">Découvrir la boutique <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} /></BoutonLien>
            <a href="#par-type" className={styleBouton({ variante: 'contour', taille: 'lg' })}>Acheter par type</a>
          </motion.div>
        </div>
        <div className="hidden lg:block" />
      </motion.div>

      <a href="#a-la-une" className="absolute bottom-7 left-[28%] z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-encre/70 lg:flex">
        <span className="label">Découvrir</span>
        <ArrowDown className="h-4 w-4 animate-descendre" strokeWidth={1.25} />
      </a>
    </section>
  )
}

/** Bouton pilule « Tout voir → » des en-têtes de section (Relevé : `px-5.5 py-3`, mono 11 px, interlettrage .2em). */
function LienSection({ vers, children, clair }: { vers: string; children: ReactNode; clair?: boolean }) {
  return (
    <Link to={vers} className={clair
      ? 'inline-flex items-center gap-2.5 rounded-full border border-fond/30 px-[22px] py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fond transition-colors hover:bg-fond hover:text-encre'
      : 'inline-flex items-center gap-2.5 rounded-full border border-encre px-[22px] py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-encre transition-colors hover:bg-encre hover:text-fond'}>
      {children}<ArrowRight className="h-[13px] w-[13px]" strokeWidth={2} />
    </Link>
  )
}

/** En-tête de section de la référence : surtitre à filet, titre plein + ligne en creux, bouton pilule à droite. */
function EnTeteSection({ surtitre, titre, creux, italique, lien, clair }: { surtitre: string; titre: string; creux: string; italique?: boolean; lien: { vers: string; libelle: string }; clair?: boolean }) {
  return (
    <Revelation className={`flex flex-wrap items-end justify-between gap-[30px] ${clair ? 'mb-12' : 'mb-10'}`}>
      <div>
        <p className={`surtitre ${clair ? 'text-fond/60' : 'text-gris'}`}>{surtitre}</p>
        <h2 className={`titre-section ${clair ? 'text-fond' : ''}`}>{titre}<br /><span className={`${clair ? 'contour-fond' : 'contour-encre'} ${italique ? 'italic' : ''}`}>{creux}</span></h2>
      </div>
      <LienSection vers={lien.vers} clair={clair}>{lien.libelle}</LienSection>
    </Revelation>
  )
}

/** cloneme: C-14 — section « Les plus aimés / Meilleures ventes » de la référence : grille 2 / 4 colonnes, écart 24 px, cartes numérotées (C-09 `numero`).
 *  H MODE : les pièces mises en avant (`misEnAvant`) ; on n'écrit pas « meilleures ventes », aucun chiffre de vente n'existe. */
function ALaUne() {
  const vedettes = produits.filter(p => p.misEnAvant)
  return (
    <section id="a-la-une" className="section-of scroll-mt-20">
      <EnTeteSection surtitre="À la une" titre="Pièces" creux="du moment" lien={{ vers: '/boutique?tag=une', libelle: 'Tout voir' }} />
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {vedettes.map((p, i) => <li key={p.slug}><Revelation delai={(i % 4) * 0.06} className="h-full"><CarteProduit produit={p} numero={i + 1} className="h-full" /></Revelation></li>)}
      </ul>
    </section>
  )
}

/** Teintes des cartes « par type » : fonds de la référence (encre, jaune) et touche beige H MODE. `clair` = texte encre. */
const TEINTES = [
  { fond: 'var(--encre)', clair: false }, { fond: 'var(--accent)', clair: true }, { fond: 'var(--beige)', clair: true },
  { fond: 'var(--fond-3)', clair: true }, { fond: 'var(--encre-douce)', clair: false }, { fond: 'var(--beige-fonce)', clair: false }, { fond: 'var(--accent-doux)', clair: true },
]

/** cloneme: C-15, A-12 — section « Acheter par style » de la référence (`.style-card`) : cartes 340 / 480 px, rayon 24 px, disque, mot géant en creux,
 *  pastille + flèche jaune en haut, image inclinée au centre, nom Archivo Black + compteur mono en bas.
 *  H MODE : un style = un type de vêtement (7) ; la 1re et la dernière carte occupent deux colonnes pour remplir la grille. */
function ParType() {
  const cats = categoriesActives().map(c => ({ ...c, n: produits.filter(p => p.categorie === c.slug).length })).filter(c => c.n > 0)
  return (
    <section id="par-type" className="section-of scroll-mt-20 border-y border-ligne bg-fond-2">
      <EnTeteSection surtitre="Catalogue" titre="Acheter par" creux="type" italique lien={{ vers: '/boutique', libelle: 'Tous les types' }} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-[18px]">
        {cats.map((c, i) => {
          const t = TEINTES[i % TEINTES.length]
          const large = cats.length % 3 === 1 && (i === 0 || i === cats.length - 1)
          return (
            <Revelation key={c.slug} delai={(i % 3) * 0.06} className={large ? 'md:col-span-2' : ''}>
              <Link to={`/boutique/${c.slug}`} style={{ background: t.fond }}
                className={`carte-type relative flex h-[340px] flex-col justify-between overflow-hidden rounded-3xl p-5 transition-transform duration-[400ms] md:h-[480px] md:p-[30px] ${t.clair ? 'text-encre' : 'text-fond'}`}>
                <span aria-hidden className={`pointer-events-none absolute -bottom-[100px] -left-[100px] h-[340px] w-[340px] rounded-full ${t.clair ? 'bg-encre/[0.06]' : 'bg-blanc/[0.12]'}`} />
                <span aria-hidden className="pointer-events-none absolute -bottom-[30px] -right-[10px] whitespace-nowrap font-display uppercase leading-[0.8] tracking-[-0.04em] text-transparent"
                  style={{ fontSize: 'clamp(120px, 16vw, 220px)', WebkitTextStroke: t.clair ? '1.5px color-mix(in srgb, var(--encre) 10%, transparent)' : '1.5px color-mix(in srgb, var(--blanc) 16%, transparent)' }}>{c.nom.split(' ')[0]}</span>
                <div className="relative z-[2] flex items-start justify-between">
                  <span className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-[6px] ${t.clair ? 'bg-encre/[0.06]' : 'bg-blanc/[0.16]'}`}>Type</span>
                  <span className="carte-type-fleche grid h-[46px] w-[46px] place-items-center rounded-full bg-accent text-encre"><ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} /></span>
                </div>
                {c.image && <img src={srcImage(c.image, 480)} srcSet={srcsetImage(c.image)} sizes="(min-width: 768px) 22vw, 60vw" alt="" loading="lazy"
                  className="carte-type-img pointer-events-none absolute left-1/2 top-[46%] z-[1] aspect-[4/5] w-[46%] max-w-[260px] rounded-[18px] object-cover shadow-[0_30px_30px_-10px_rgb(0_0_0/0.35)]" />}
                <div className="relative z-[2]">
                  <p className="mb-1.5 font-display uppercase leading-[0.95] tracking-[-0.01em]" style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>{c.nom}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">{c.n} pièce{c.n > 1 ? 's' : ''}</p>
                </div>
              </Link>
            </Revelation>
          )
        })}
      </div>
    </section>
  )
}

/** cloneme: C-25 — section « La Maison » de H MODE (conservée à la demande de l'utilisateur), mise au vocabulaire de la référence :
 *  écrin noir rayon 28 px (carte « Accès anticipé »), surtitre à filet, titre plein + creux italique, chiffres réels en Archivo Black, pilule « → ». */
function LaMaison() {
  const marques = [...new Set(produits.map(p => p.marque))]
  const stats = [{ valeur: marques.length, libelle: 'marques' }, { valeur: produits.length, libelle: 'pièces' }]
  return (
    <section className="section-of grid items-center gap-12 md:grid-cols-2 md:gap-16">
      <Revelation className="mx-auto w-full max-w-md">
        <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-encre px-4 text-center text-fond sm:px-6">
          <Monogramme className="h-10" />
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">La sélection</p>
          <LoopingWords words={marques} fond="var(--encre)" classeMot="text-fond" className="mt-4 text-[clamp(1.4rem,6.4vw,2.75rem)]" />
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-fond/60">{boutique.ville.split(',')[0]}</p>
        </div>
      </Revelation>
      <Revelation>
        <p className="surtitre text-gris">La Maison</p>
        <h2 className="font-display text-[clamp(40px,5.4vw,72px)] uppercase leading-[0.88] tracking-[-0.025em]">L'élégance,<br /><span className="contour-encre italic">choisie avec soin</span></h2>
        <p className="mt-6 max-w-md text-[15px] leading-[1.55] text-gris">
          H MODE réunit à {boutique.ville.split(',')[0]} une sélection de pièces des grandes maisons, présentées et conseillées personnellement.
        </p>
        <dl className="mt-8 grid max-w-md grid-cols-2 divide-x divide-ligne border-y border-ligne">
          {stats.map(st => (
            <div key={st.libelle} className="flex flex-col gap-2 py-6 first:pr-6 last:pl-6">
              <dd className="font-display text-[clamp(2.75rem,5vw,3.75rem)] leading-none"><CountUp value={st.valeur} /></dd>
              <dt className="order-first font-mono text-[11px] uppercase tracking-[0.22em] text-gris">{st.libelle}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-8"><LienSection vers="/maison">Découvrir la maison</LienSection></div>
      </Revelation>
    </section>
  )
}

const ARGUMENTS = [
  { Icone: ShieldCheck, titre: 'Revendeur agréé', texte: 'Des pièces issues des maisons dont H MODE est revendeur.' },
  { Icone: MessageCircle, titre: 'Conseil sur WhatsApp', texte: 'Une question de taille ou de disponibilité ? Nous répondons personnellement.' },
  { Icone: Banknote, titre: boutique.paiement, texte: 'Vous réglez à la réception de votre commande, à votre porte.' },
  { Icone: ShoppingBag, titre: 'Commande simple', texte: 'Choisissez vos pièces, nous confirmons tout avec vous sur WhatsApp.' },
]

/** cloneme: C-16 — bloc noir « Pourquoi » de la référence (sans son disque jaune, retiré à la demande de l'utilisateur) : titre plein + creux italique clair,
 *  4 colonnes séparées par des filets, numéro jaune, icône dans un carré arrondi 54 px. Arguments réels H MODE (ADR 0001, décision D1). */
function Pourquoi() {
  return (
    <section className="section-of relative overflow-hidden bg-encre text-fond">
      <EnTeteSection clair surtitre="Pourquoi H MODE" titre="Le casual" creux="Autrement" italique lien={{ vers: '/boutique', libelle: 'Acheter' }} />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {ARGUMENTS.map(({ Icone, titre, texte }, i) => (
          <Revelation key={titre} delai={i * 0.08} className={`flex flex-col gap-3.5 px-4 py-9 md:px-[30px] ${i === 0 ? '!pl-0' : 'border-l border-fond/[0.12]'} ${i === 2 ? 'max-md:!border-l-0 max-md:!pl-0' : ''}`}>
            <span className="font-mono text-[10px] tracking-[0.22em] text-accent">{String(i + 1).padStart(2, '0')}</span>
            <span className="mb-1.5 grid h-[54px] w-[54px] place-items-center rounded-bloc border border-fond/[0.12] bg-fond/[0.06] text-accent"><Icone className="h-6 w-6" strokeWidth={1.5} /></span>
            <h3 className="font-display text-[16px] uppercase tracking-[0.02em]">{titre}</h3>
            <p className="text-[14px] leading-[1.55] text-fond/70">{texte}</p>
          </Revelation>
        ))}
      </div>
    </section>
  )
}

/** cloneme: C-17, A-06 — carte noire de la référence (inscription « Accès anticipé ») sur un filigrane géant en creux qui défile.
 *  H MODE : pas d'envoi d'e-mail → la carte invite à suivre la boutique (Instagram, Facebook, WhatsApp), même mise en page. */
function Suivre() {
  const liens = [
    { nom: 'Instagram', url: boutique.instagram.url, Icone: IconeInstagram },
    { nom: 'Facebook', url: boutique.facebook.url, Icone: IconeFacebook },
    { nom: 'WhatsApp', url: lienWhatsApp('Bonjour H MODE, je souhaite être informé des nouveautés.'), Icone: IconeWhatsApp },
  ]
  return (
    <section className="relative overflow-hidden border-t border-ligne bg-fond px-5 py-12 md:px-14 md:py-20">
      <div aria-hidden className="pointer-events-none absolute -left-[4%] -right-[4%] top-1/2 z-0 -translate-y-1/2 overflow-hidden">
        <div className="anim-filigrane contour-filigrane flex w-max whitespace-nowrap font-display uppercase leading-[0.86] tracking-[-0.03em]" style={{ fontSize: 'clamp(120px, 18vw, 260px)' }}>
          <span className="pr-[0.4em]">H MODE · H MODE ·</span><span className="pr-[0.4em]">H MODE · H MODE ·</span>
        </div>
      </div>
      <Revelation className="relative z-[1] mx-auto flex max-w-[780px] flex-wrap items-center gap-[30px] rounded-[28px] bg-encre p-6 text-fond md:p-[42px_44px]">
        <div className="min-w-[240px] flex-1">
          <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Nouveautés</p>
          <h3 className="mb-2 font-display text-[clamp(28px,3vw,40px)] uppercase leading-[0.95] tracking-[-0.015em]">Les arrivages<br /><span className="italic text-transparent [-webkit-text-stroke:1.8px_var(--fond)]">en premier</span></h3>
          <p className="max-w-[340px] text-[14px] leading-[1.5] text-fond/65">Arrivages, coloris et coulisses de la boutique : suivez H MODE sur nos réseaux.</p>
        </div>
        <div className="flex min-w-[280px] flex-[1.1] flex-col gap-2.5">
          {liens.map(({ nom, url, Icone }) => (
            <a key={nom} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-full border border-fond/[0.12] bg-fond/[0.06] p-1.5 pl-5 text-[15px] transition-colors hover:border-fond/30">
              <span className="flex items-center gap-3"><Icone className="h-4 w-4" />{nom}</span>
              <span className="flex items-center gap-2 rounded-full bg-accent px-[22px] py-3 font-display text-[11px] uppercase tracking-[0.16em] text-encre transition-all hover:scale-[1.04] hover:bg-accent-doux">Suivre<ArrowRight className="h-[13px] w-[13px]" strokeWidth={2} /></span>
            </a>
          ))}
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-fond/40">Liens officiels H MODE · ouverture dans un nouvel onglet</p>
        </div>
      </Revelation>
    </section>
  )
}

/** cloneme: C-18 — appel final de la référence (« Aller plus loin ») : filet vertical 80 px, réseaux en mono, titre géant plein + creux italique,
 *  texte gris, gros bouton jaune avec point noir. H MODE : contact WhatsApp. */
function AppelFinal() {
  const reseaux = [{ l: 'IG', url: boutique.instagram.url }, { l: 'FB', url: boutique.facebook.url }, { l: 'WA', url: lienWhatsApp('Bonjour H MODE.') }]
  return (
    <section className="relative px-5 py-16 md:px-[120px] md:py-20">
      <div className="mb-[50px] flex flex-col items-center gap-[18px]">
        <span aria-hidden className="h-20 w-px bg-encre opacity-60" />
        <ul className="flex gap-[22px] font-mono text-[11px] uppercase tracking-[0.25em]">
          {reseaux.map(r => <li key={r.l}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-encre transition-colors hover:text-danger">{r.l}</a></li>)}
        </ul>
      </div>
      <Revelation className="mx-auto max-w-[680px] text-center">
        <h2 className="mb-[18px] flex flex-wrap justify-center gap-x-[0.25em] font-display uppercase leading-[0.86] tracking-[-0.025em]" style={{ fontSize: 'clamp(48px, 11vw, 160px)' }}>
          <span className="inline-block">Parlons</span><span className="inline-block italic text-transparent [-webkit-text-stroke:2.5px_var(--encre)]">style</span>
        </h2>
        <p className="mx-auto mb-8 max-w-[520px] text-[15px] leading-[1.55] text-gris">Une pièce en tête ? Taille, coloris, disponibilité : écrivez-nous, nous vous répondons personnellement.</p>
        <a href={lienWhatsApp('Bonjour H MODE, je cherche une pièce.')} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full bg-accent px-9 py-[18px] font-display text-[14px] uppercase tracking-[0.16em] text-encre transition-all hover:scale-[1.04] hover:bg-accent-doux">
          <span className="h-2 w-2 rounded-full bg-encre" />Écrire sur WhatsApp
        </a>
      </Revelation>
    </section>
  )
}

/** cloneme: P-01 — accueil dans l'ordre de la référence : héros (H MODE) · bandeau noir · à la une · par type · La Maison (H MODE) · pourquoi · suivre · appel final. */
export function PageAccueil() {
  return (
    <>
      <Heros />
      {/* cloneme: C-02 — bandeau noir sous le héros, comme la référence ; faits réels (comptes lus dans le catalogue) */}
      <BandeauDefilant elements={[boutique.paiement, 'Commande sur WhatsApp', `${new Set(produits.map(p => p.marque)).size} marques`, `${produits.length} pièces`, boutique.ville.split(',')[0]]} />
      <ALaUne />
      <ParType />
      <LaMaison />
      <Pourquoi />
      <Suivre />
      <AppelFinal />
    </>
  )
}
