/**
 * Adapté de Lightswind UI — « command » (licence MIT, https://lightswind.com/components/command).
 * Palette de commandes : fenêtre ouverte par Ctrl+K / ⌘K, champ de recherche, résultats groupés, flèches haut / bas,
 * Entrée pour choisir, Échap pour fermer. Adapté : motif ARIA « combobox + listbox » (aria-activedescendant), recherche
 * sans accents ni casse, focus piégé dans la fenêtre puis rendu à l'élément d'origine, fenêtre en portail sur <body>.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Search } from 'lucide-react'
import { usePiegeFocus } from '@/design-system'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export interface CommandItem { id: string; libelle: string; groupe: string; icone?: ReactNode; motsCles?: string; onSelect: () => void }

const normaliser = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function CommandDialog({ ouvert, onFermer, items, placeholder = 'Rechercher…', vide = 'Aucun résultat.' }: {
  ouvert: boolean; onFermer: () => void; items: CommandItem[]; placeholder?: string; vide?: string
}) {
  const id = useId()
  const actives = useAnimationsActives()
  const ref = usePiegeFocus(ouvert, onFermer)
  const champ = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const resultats = useMemo(() => {
    const t = normaliser(q.trim())
    return t ? items.filter(x => normaliser(`${x.libelle} ${x.groupe} ${x.motsCles ?? ''}`).includes(t)) : items
  }, [items, q])
  useEffect(() => { if (ouvert) { setQ(''); setI(0); champ.current?.focus() } }, [ouvert])
  useEffect(() => setI(0), [q])
  const choisir = (x: CommandItem | undefined) => { if (!x) return; onFermer(); x.onSelect() }
  const groupes = [...new Set(resultats.map(r => r.groupe))]

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-encre/40 backdrop-blur-[2px]" onClick={onFermer} aria-hidden
            initial={actives ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Recherche dans l'administration"
            className="relative w-full max-w-xl overflow-hidden rounded-carte border border-ligne bg-fond-2 shadow-flottant"
            initial={actives ? { opacity: 0, y: -8, scale: 0.98 } : false} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18 }}>
            <div className="flex items-center gap-3 border-b border-ligne px-4">
              <Search className="h-4 w-4 shrink-0 text-gris" aria-hidden />
              <input ref={champ} autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
                role="combobox" aria-expanded aria-controls={`${id}-liste`} aria-autocomplete="list" aria-label="Rechercher une page ou une action"
                aria-activedescendant={resultats[i] ? `${id}-${resultats[i].id}` : undefined}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setI(n => Math.min(resultats.length - 1, n + 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setI(n => Math.max(0, n - 1)) }
                  if (e.key === 'Enter') { e.preventDefault(); choisir(resultats[i]) }
                }}
                className="h-12 flex-1 bg-transparent text-[14px] text-encre outline-none placeholder:text-gris-clair focus-visible:outline-none" />
              <kbd className="rounded-[6px] border border-ligne px-1.5 py-0.5 font-mono text-[10px] text-gris">Échap</kbd>
            </div>
            <ul id={`${id}-liste`} role="listbox" aria-label="Résultats" className="max-h-[50vh] overflow-y-auto p-2">
              {resultats.length === 0 && <li role="presentation" className="px-3 py-8 text-center text-[13px] text-gris">{vide}</li>}
              {groupes.map(g => (
                <li key={g} role="presentation">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-gris" aria-hidden>{g}</p>
                  <ul role="group" aria-label={g}>
                    {resultats.filter(r => r.groupe === g).map(r => {
                      const n = resultats.indexOf(r)
                      return (
                        <li key={r.id} id={`${id}-${r.id}`} role="option" aria-selected={n === i} onMouseMove={() => setI(n)} onClick={() => choisir(r)}
                          className={cn('flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2 text-[13.5px]', n === i ? 'bg-fond-3 text-encre' : 'text-encre/85')}>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-ligne bg-fond-2 text-gris">{r.icone}</span>
                          <span className="flex-1">{r.libelle}</span>
                          {n === i && <CornerDownLeft className="h-3.5 w-3.5 text-gris" aria-hidden />}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body)
}
