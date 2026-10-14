import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleAlert, Info, X } from 'lucide-react'
import { EASE_MAISON } from '@/lib/animations'
import { cn } from '@/lib/utils'

type Ton = 'succes' | 'erreur' | 'info'
interface Notif { id: number; ton: Ton; message: ReactNode; action?: { libelle: string; onClick: () => void } }
type Notifier = (n: Omit<Notif, 'id'> & { duree?: number }) => void

const Ctx = createContext<Notifier | null>(null)
const ICONES = { succes: Check, erreur: CircleAlert, info: Info }

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notif[]>([])
  const fermer = useCallback((id: number) => setListe(l => l.filter(n => n.id !== id)), [])
  const notifier = useCallback<Notifier>(({ duree = 4500, ...n }) => {
    const id = Date.now() + Math.random()
    setListe(l => [...l.slice(-2), { ...n, id }])
    window.setTimeout(() => fermer(id), duree)
  }, [fermer])
  const v = useMemo(() => notifier, [notifier])
  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-8 sm:top-auto sm:items-end sm:px-8" aria-live="polite" role="status">
        <AnimatePresence initial={false}>
          {liste.map(n => {
            const I = ICONES[n.ton]
            return (
              <motion.div key={n.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: EASE_MAISON }}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 bg-encre px-5 py-4 text-[14px] text-nacre shadow-flottant">
                <I className={cn('h-4 w-4 shrink-0', n.ton === 'erreur' ? 'text-[#E8A598]' : 'text-or')} aria-hidden />
                <div className="flex-1">{n.message}</div>
                {n.action && <button type="button" onClick={() => { n.action!.onClick(); fermer(n.id) }} className="label underline underline-offset-4 hover:text-or">{n.action.libelle}</button>}
                <button type="button" onClick={() => fermer(n.id)} aria-label="Fermer la notification" className="text-nacre/60 hover:text-nacre"><X className="h-4 w-4" /></button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useNotifier() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useNotifier hors FournisseurNotifications')
  return c
}
