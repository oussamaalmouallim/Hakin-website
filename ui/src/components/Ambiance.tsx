import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { IconeWhatsApp } from '@/design-system'
import { lienWhatsApp } from '@/lib/whatsapp'
import { INTRO } from '@/lib/animations'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

/** cloneme: C-02, A-05 — bandeau noir défilant de la référence : Archivo Black 18 px capitales,
 *  pastille jaune de 10 px après chaque élément, écart 48 px, boucle de 30 s. Textes réels H MODE uniquement. */
export function BandeauDefilant({ elements }: { elements: string[] }) {
  const serie = [...elements, ...elements]
  return (
    <div data-ref="bandeau" className="overflow-hidden border-y border-encre bg-encre py-[18px] text-fond" aria-label={elements.join(' · ')}>
      <div className="anim-bande flex w-max whitespace-nowrap font-display text-[18px] uppercase tracking-[0.04em]" aria-hidden>
        {serie.map((e, i) => (
          <span key={i} className="flex items-center gap-12 pr-12">
            {e}<span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  )
}

/** cloneme: C-07 — repère vertical fixé à droite (≥ 1024 px) : mono 10 px gris, filet de 60 px entre deux mots. */
export function RepereLateral() {
  return (
    <div aria-hidden className="pointer-events-none fixed right-7 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gris lg:flex">
      <span className="[writing-mode:vertical-rl]">H MODE</span>
      <span className="h-[60px] w-px bg-current opacity-40" />
      <span className="[writing-mode:vertical-rl]">Casa</span>
    </div>
  )
}

/** Bouton WhatsApp flottant (conservé), masqué pendant la commande. */
export function BoutonWhatsAppFlottant() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/commande')) return null
  // Fiche produit (mobile) : la barre d'achat collante porte déjà le bouton WhatsApp, on évite le chevauchement.
  const surFiche = pathname.startsWith('/produit/')
  return (
    <a href={lienWhatsApp('Bonjour H MODE, j\'ai une question.')} target="_blank" rel="noopener noreferrer" aria-label="Écrire à H MODE sur WhatsApp"
      className={cn('group fixed bottom-[calc(1.25rem+var(--demo-h)+env(safe-area-inset-bottom))] right-5 z-40 flex h-14 items-center gap-0 overflow-hidden rounded-full bg-encre pl-4 pr-4 text-nacre shadow-flottant ring-1 ring-nacre/20 transition-all duration-700 ease-maison hover:gap-3 hover:pr-6 sm:bottom-[calc(2rem+var(--demo-h)+env(safe-area-inset-bottom))] sm:right-8', surFiche && 'max-lg:hidden')}>
      <IconeWhatsApp className="h-6 w-6 shrink-0 text-whatsapp" />
      <span className="label max-w-0 overflow-hidden whitespace-nowrap transition-[max-width] duration-700 ease-maison group-hover:max-w-[10rem]">Nous écrire</span>
    </a>
  )
}

/** cloneme: A-14 — écran d'entrée de la référence (composant d'intro, cas « visiteur qui revient »), à chaque chargement du site :
 *  fond encre plein écran ; à 200 ms le nom monte de 28 px et apparaît (550 ms, retard 150 ms), la ligne mono jaune suit (retard 400 ms) ;
 *  une barre jaune de 2 px se remplit en 1,5 s ; à 1 900 ms l'écran monte comme un rideau (750 ms, `--courbe-rideau`) ; retiré à 2 700 ms.
 *  Le défilement de la page est bloqué pendant l'intro. Sans choix de langue ni vidéo : site en français seul, vidéo exclue.
 *  Animations coupées, ou drapeau `hmode-sans-intro` (tests) : pas d'intro. */
export function ChargeurMarque() {
  const actives = useAnimationsActives()
  const [etape, setEtape] = useState<'in' | 'marque' | 'sortie' | 'fin'>(() => {
    try { if (sessionStorage.getItem('hmode-sans-intro')) return 'fin' } catch { /* stockage indisponible */ }
    return 'in'
  })
  useEffect(() => {
    if (etape === 'fin') return
    if (!actives) { setEtape('fin'); return }
    document.body.style.overflow = 'hidden'
    const t = [
      window.setTimeout(() => setEtape('marque'), INTRO.marque),
      window.setTimeout(() => setEtape('sortie'), INTRO.sortie),
      window.setTimeout(() => { document.body.style.overflow = ''; setEtape('fin') }, INTRO.fin),
    ]
    return () => { t.forEach(window.clearTimeout); document.body.style.overflow = '' }
  }, [actives]) // eslint-disable-line react-hooks/exhaustive-deps
  if (etape === 'fin' || !actives) return null
  const visible = etape !== 'in'
  return (
    <div aria-hidden className={cn('fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-encre will-change-transform',
      etape === 'sortie' ? '-translate-y-full transition-transform duration-[750ms] ease-[var(--courbe-rideau)]' : 'translate-y-0')}>
      <div className={cn('font-display text-[clamp(2rem,6vw,5rem)] uppercase leading-none tracking-[-0.02em] text-fond transition-[opacity,transform] delay-150 duration-[550ms] ease-[var(--courbe-panneau)]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0')}>H Mode</div>
      <div className={cn('mt-3.5 font-mono text-[clamp(0.6rem,1.2vw,0.75rem)] uppercase tracking-[0.22em] text-accent transition-opacity delay-[400ms] duration-500 ease-linear',
        visible ? 'opacity-100' : 'opacity-0')}>Casablanca · Style · Quality · You</div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-fond/[0.08]">
        {/* Référence : `width 0 → 100%` ; ici `scaleX` depuis la gauche, même rendu sans recalcul de mise en page */}
        <div className={cn('h-full origin-left bg-accent', visible ? 'scale-x-100 transition-transform duration-[1500ms] ease-[var(--courbe-standard)]' : 'scale-x-0')} />
      </div>
    </div>
  )
}
