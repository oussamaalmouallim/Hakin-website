import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { IconeWhatsApp, Monogramme } from '@/design-system'
import { lienWhatsApp } from '@/lib/whatsapp'
import { MODE_DEMO } from '@/lib/catalogue'
import { EASE_MAISON } from '@/lib/animations'
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

/** Loader de marque (repris de l'ancien site) : première visite de la session, ≤ 900 ms. */
export function ChargeurMarque() {
  const [visible, setVisible] = useState(() => { try { return !sessionStorage.getItem('hmode-vu') } catch { return false } })
  useEffect(() => {
    if (!visible) return
    try { sessionStorage.setItem('hmode-vu', '1') } catch { /* ignoré */ }
    const t = window.setTimeout(() => setVisible(false), 900)
    return () => window.clearTimeout(t)
  }, [visible])
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="fixed inset-0 z-[500] grid place-items-center bg-fond" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE_MAISON }} aria-hidden>
          <motion.div className="flex flex-col items-center gap-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_MAISON }}>
            <Monogramme className="h-20" />
            <span className="font-display text-[26px] uppercase tracking-[0.4em]">H Mode</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function BandeauDemo() {
  if (!MODE_DEMO) return null
  return <div className="label fixed inset-x-0 bottom-0 z-[60] h-[var(--demo-h)] truncate bg-alerte px-4 py-1.5 text-center text-nacre">Mode démo — prix<span className="hidden sm:inline"> et tailles</span> fictifs<span className="hidden sm:inline">, pour tester le panier</span></div>
}
