import { useEffect, useState } from 'react'
import type { Transition, Variants } from 'framer-motion'

export const EASE_MAISON = [0.16, 1, 0.3, 1] as const
/** cloneme: A-08, A-09, A-10 — courbe des panneaux de la référence (`cubic-bezier(.2,.8,.2,1)`). cloneme-ok */
export const EASE_PANNEAU = [0.2, 0.8, 0.2, 1] as const
/** Seuil de défilement de l'en-tête (Relevé : `window.scrollY > 50`). */
export const SEUIL_ENTETE = 50
/** Durées des panneaux en secondes (Relevé : menu .4s, recherche et panier .42s). */
export const DUREE_MENU = 0.4
export const DUREE_PANNEAU = 0.42

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
