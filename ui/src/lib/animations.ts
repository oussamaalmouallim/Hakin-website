import { useEffect, useState } from 'react'
import type { Transition, Variants } from 'framer-motion'

export const EASE_MAISON = [0.16, 1, 0.3, 1] as const

export const conteneurCascade: Variants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
export const elementApparition: Variants = {
  cache: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_MAISON } },
}
export const transitionPage = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.5, ease: EASE_MAISON } satisfies Transition,
}
export const sansMouvement = { initial: false, animate: {}, exit: {}, transition: { duration: 0 } } as const

/** Vrai si la requête média correspond (suivi en direct). Sert à couper les effets liés au défilement en mobile. */
export function useMedia(requete: string) {
  const lire = () => typeof window !== 'undefined' && !!window.matchMedia?.(requete).matches
  const [ok, setOk] = useState(lire)
  useEffect(() => {
    const mq = window.matchMedia?.(requete)
    if (!mq) return
    const f = () => setOk(mq.matches)
    f(); mq.addEventListener?.('change', f)
    return () => mq.removeEventListener?.('change', f)
  }, [requete])
  return ok
}
