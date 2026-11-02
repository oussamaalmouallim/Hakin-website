import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { EASE_MAISON } from '@/lib/animations'

export function FilAriane({ elements }: { elements: { libelle: string; vers?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gris">
        {elements.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {e.vers && i < elements.length - 1 ? <Link to={e.vers} className="hover:text-encre">{e.libelle}</Link>
              : <span aria-current={i === elements.length - 1 ? 'page' : undefined} className="text-encre">{e.libelle}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Accordeon({ titre, children, ouvertParDefaut = false }: { titre: string; children: ReactNode; ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  return (
    <div className="border-b border-ligne">
      <button type="button" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="label-large">{titre}</span>
        <Plus className={`h-4 w-4 transition-transform duration-500 ease-maison ${ouvert ? 'rotate-45' : ''}`} strokeWidth={1.25} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_MAISON }} className="overflow-hidden">
            <div className="pb-6 text-[15px] leading-relaxed text-gris">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Badge({ children, ton = 'clair' }: { children: ReactNode; ton?: 'clair' | 'sombre' | 'or' }) {
  // Pastille de la référence : mono 10 px .16em, `px-2 py-1`, rayon plein ; `or` = jaune (`tag-hot`).
  const s = { clair: 'bg-fond/90 text-encre', sombre: 'bg-encre text-fond', or: 'bg-accent text-encre' }[ton]
  return <span className={`inline-flex items-center rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${s}`}>{children}</span>
}
