/**
 * Adapté de Lightswind UI — « looping-words » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : Cormorant, équerres d'or autour du mot affiché, fondu vers la couleur du fond (prop `fond`).
 * Animations coupées : premier mot affiché, immobile. Lecteurs d'écran : liste complète en texte caché.
 */
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export function LoopingWords({ words, className, fond = '#FBF9F5', classeMot = 'text-encre', intervalle = 2400 }: {
  words: string[]; className?: string; fond?: string; classeMot?: string; intervalle?: number
}) {
  const actives = useAnimationsActives()
  const controls = useAnimationControls()
  const refs = useRef<(HTMLLIElement | null)[]>([])
  const [largeur, setLargeur] = useState(0)
  const doubles = [...words, ...words]

  useEffect(() => {
    const mesurer = (n: number) => { const el = refs.current[n]; if (el) setLargeur(el.firstElementChild?.getBoundingClientRect().width ?? 0) }
    mesurer(1)
    if (!actives || words.length < 2) return
    let n = 0
    const id = setInterval(async () => {
      n++
      mesurer((n % words.length) + 1)
      await controls.start({ y: `-${(n * 100) / doubles.length}%`, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } })
      if (n === words.length) { n = 0; controls.set({ y: '0%' }) }
    }, intervalle)
    return () => clearInterval(id)
  }, [actives, controls, words.length, doubles.length, intervalle])

  const equerre = 'absolute h-[0.14em] w-[0.14em] border-or'
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <span className="sr-only">{words.join(', ')}</span>
      <div aria-hidden className="relative h-[2.7em] overflow-hidden whitespace-nowrap px-[0.3em] leading-[0.9]">
        <motion.ul className="m-0 flex list-none flex-col items-center p-0" animate={controls} initial={{ y: '0%' }}>
          {doubles.map((w, i) => (
            <li key={i} ref={el => { refs.current[i] = el }} className="flex h-[0.9em] items-center justify-center">
              <span className={cn('font-display uppercase tracking-[0.06em]', classeMot)}>{w}</span>
            </li>
          ))}
        </motion.ul>
        <div className="pointer-events-none absolute inset-0 z-10"
          style={{ backgroundImage: `linear-gradient(180deg, ${fond} 30%, transparent 40%, transparent 60%, ${fond} 70%)` }} />
        <motion.div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[1.05em] -translate-x-1/2 -translate-y-1/2"
          animate={{ width: largeur + 28 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <span className={cn(equerre, 'left-0 top-0 border-l border-t')} />
          <span className={cn(equerre, 'right-0 top-0 border-r border-t')} />
          <span className={cn(equerre, 'bottom-0 left-0 border-b border-l')} />
          <span className={cn(equerre, 'bottom-0 right-0 border-b border-r')} />
        </motion.div>
      </div>
    </div>
  )
}
