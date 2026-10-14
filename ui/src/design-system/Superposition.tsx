import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { EASE_MAISON } from '@/lib/animations'
import { cn } from '@/lib/utils'

const FOCUSABLES = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Piège le focus, ferme sur Échap, bloque le défilement de la page, rend le focus à l'ouvreur. */
function usePiegeFocus(ouvert: boolean, onFermer: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ouvert) return
    const ouvreur = document.activeElement as HTMLElement | null
    const html = document.documentElement
    const ancien = html.style.overflow
    html.style.overflow = 'hidden'
    const t = window.setTimeout(() => (ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCUSABLES))?.focus(), 60)
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onFermer() }
      if (e.key !== 'Tab' || !ref.current) return
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLES)]
      if (!els.length) return
      const [premier, dernier] = [els[0], els[els.length - 1]]
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus() }
    }
    document.addEventListener('keydown', clavier)
    return () => { window.clearTimeout(t); html.style.overflow = ancien; document.removeEventListener('keydown', clavier); ouvreur?.focus?.() }
  }, [ouvert, onFermer])
  return ref
}

export function BoutonFermer({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label="Fermer"
      className={cn('grid h-10 w-10 place-items-center rounded-full text-encre transition-transform duration-500 ease-maison hover:rotate-90', className)}>
      <X className="h-5 w-5" strokeWidth={1.25} />
    </button>
  )
}

export function Modale({ ouvert, onFermer, titre, children, large }: { ouvert: boolean; onFermer: () => void; titre: string; children: ReactNode; large?: boolean }) {
  const ref = usePiegeFocus(ouvert, onFermer)
  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-encre/40 backdrop-blur-[2px]" onClick={onFermer}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={titre}
            className={cn('relative max-h-[90vh] w-full overflow-y-auto bg-nacre p-6 shadow-flottant sm:p-10', large ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.6, ease: EASE_MAISON }}>
            <div className="mb-6 flex items-start justify-between gap-6">
              <h2 className="titre-3">{titre}</h2>
              <BoutonFermer onClick={onFermer} className="-mr-2 -mt-2" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body)
}

export function Tiroir({ ouvert, onFermer, titre, children, cote = 'droite', pied, label }: {
  ouvert: boolean; onFermer: () => void; titre: ReactNode; children: ReactNode; cote?: 'droite' | 'gauche'; pied?: ReactNode; label: string
}) {
  const ref = usePiegeFocus(ouvert, onFermer)
  const x = cote === 'droite' ? '100%' : '-100%'
  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[70]">
          <motion.div className="absolute inset-0 bg-encre/30" onClick={onFermer}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} />
          <motion.aside ref={ref} role="dialog" aria-modal="true" aria-label={label}
            className={cn('absolute top-0 flex h-full w-full max-w-[440px] flex-col bg-nacre shadow-flottant', cote === 'droite' ? 'right-0' : 'left-0')}
            initial={{ x }} animate={{ x: 0 }} exit={{ x }} transition={{ duration: 0.7, ease: EASE_MAISON }}>
            <header className="flex items-center justify-between border-b border-ligne px-6 py-5">
              <div className="label-large">{titre}</div>
              <BoutonFermer onClick={onFermer} className="-mr-2" />
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {pied && <footer className="border-t border-ligne px-6 py-6">{pied}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>, document.body)
}
