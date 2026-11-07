import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

const CLE = 'hmode-animations'
const Ctx = createContext<{ animations: boolean; basculer: () => void } | null>(null)

const reduit = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animations on/off : respecte prefers-reduced-motion et mémorise le choix du visiteur. */
export function FournisseurAnimations({ children }: { children: ReactNode }) {
  const [animations, set] = useState(() => {
    try { const v = localStorage.getItem(CLE); if (v !== null) return v === '1' } catch { /* stockage indisponible */ }
    return !reduit()
  })
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const f = () => set(!mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.animations = animations ? 'on' : 'off'
    try { localStorage.setItem(CLE, animations ? '1' : '0') } catch { /* ignoré */ }
  }, [animations])
  const v = useMemo(() => ({ animations, basculer: () => set(x => !x) }), [animations])
  return (
    <Ctx.Provider value={v}>
      <MotionConfig reducedMotion={animations ? 'never' : 'always'}>{children}</MotionConfig>
    </Ctx.Provider>
  )
}

/** Version tolérante (hors fournisseur = animations actives) pour les composants de base. */
export const useAnimationsActives = () => useContext(Ctx)?.animations ?? true

export function useAnimations() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAnimations hors FournisseurAnimations')
  return c
}
