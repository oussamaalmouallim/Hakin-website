import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Monogramme H traversé d'une courbe, d'après Template/hero.png.
 *  PROVISOIRE : à remplacer par le fichier source du logo (décision D5 du plan). */
export function Monogramme({ className, titre = 'H MODE' }: { className?: string; titre?: string }) {
  const id = `hm-bronze-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 120 100" className={cn('h-10 w-auto', className)} role="img" aria-label={titre}>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9C8366" /><stop offset="0.55" stopColor="#836240" /><stop offset="1" stopColor="#5F4831" />
        </linearGradient>
      </defs>
      <text x="60" y="84" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="104" fontWeight="500" fill={`url(#${id})`}>H</text>
      <path d="M14 66 C 40 58, 62 40, 106 34 C 76 42, 52 58, 22 70 Z" fill={`url(#${id})`} />
    </svg>
  )
}

export function Logotype({ className, avecMonogramme = true, clair }: { className?: string; avecMonogramme?: boolean; clair?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3', clair ? 'text-nacre' : 'text-encre', className)}>
      {avecMonogramme && <Monogramme className="h-8" />}
      <span className="font-display text-[22px] font-medium uppercase tracking-[0.28em]">H Mode</span>
    </span>
  )
}

export function Signature({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <p className="filet-etoile text-[13px]" aria-hidden>✦</p>
      <p className="label-large text-gris">Style · Quality · You</p>
    </div>
  )
}
