/**
 * Adapté de Lightswind UI — « marquee-menu » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : vrais liens (au lieu de boutons radio), sans images, bandeau encre où défile
 * le nom de la maison sur la ligne survolée ou focalisée. Bandeau seulement sur pointeur avec survol ;
 * défilement figé si les animations sont coupées.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export interface ElementMarquee { cle: string; libelle: string; detail?: string; vers: string }

export function MarqueeMenu({ elements, className }: { elements: ElementMarquee[]; className?: string }) {
  const [actif, setActif] = useState<number | null>(null)
  const actives = useAnimationsActives()
  const total = elements.length
  const i = actif ?? 0
  const decoupe = `polygon(0 ${(i / total) * 100}%, 100% ${(i / total) * 100}%, 100% ${((i + 1) / total) * 100}%, 0 ${((i + 1) / total) * 100}%)`
  if (!total) return null
  return (
    <div className={cn('relative border-t border-ligne [--ligne-h:68px] sm:[--ligne-h:84px]', className)} onMouseLeave={() => setActif(null)}>
      {elements.map((el, n) => (
        <Link key={el.cle} to={el.vers} onMouseEnter={() => setActif(n)} onFocus={() => setActif(n)} onBlur={() => setActif(null)}
          className="group flex h-[var(--ligne-h)] items-center justify-between gap-6 border-b border-ligne outline-none focus-visible:bg-sable-50">
          <span className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] uppercase leading-none tracking-[0.08em] text-encre">{el.libelle}</span>
          <span className="flex items-center gap-5">
            {el.detail && <span className="label whitespace-nowrap text-gris">{el.detail}</span>}
            <ArrowUpRight className="h-4 w-4 text-bronze" strokeWidth={1.25} aria-hidden />
          </span>
        </Link>
      ))}

      {/* Bandeau défilant posé sur la ligne active (découpe animée) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-encre text-nacre [@media(hover:hover)]:block"
        initial={false} animate={{ clipPath: decoupe, opacity: actif === null ? 0 : 1 }}
        transition={{ clipPath: { type: 'spring', bounce: 0.08, duration: 0.6 }, opacity: { duration: 0.35 } }}>
        {elements.map(el => (
          <div key={el.cle} className="flex h-[var(--ligne-h)] items-center overflow-hidden">
            <div className={cn('flex w-max items-center', actives && 'animate-[defiler_16s_linear_infinite]')}>
              {[0, 1].map(serie => (
                <span key={serie} className="flex items-center">
                  {Array.from({ length: 6 }, (_, k) => (
                    <span key={k} className="flex items-center gap-8 pr-8">
                      <span className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] uppercase italic leading-none tracking-[0.08em]">{el.libelle}</span>
                      <span className="text-[13px] text-or">✦</span>
                      {el.detail && <span className="label whitespace-nowrap text-nacre/60">{el.detail}</span>}
                      <span className="text-[13px] text-or">✦</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
