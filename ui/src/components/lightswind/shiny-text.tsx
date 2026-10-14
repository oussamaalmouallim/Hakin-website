/**
 * Adapté de Lightswind UI — « shiny-text » (licence MIT, https://lightswind.com).
 * Ré-habillé H MODE : reflet d'or qui traverse le texte encre. `auSurvol` = reflet seulement au survol du parent `group`.
 * Animations coupées : texte encre, sans reflet.
 */
import type { ReactNode } from 'react'
import { useAnimationsActives } from '@/state/animations'
import { cn } from '@/lib/utils'

export function ShinyText({ children, className, base = '#151514', reflet = '#C8A96E', duree = 3.2, auSurvol }: {
  children: ReactNode; className?: string; base?: string; reflet?: string; duree?: number; auSurvol?: boolean
}) {
  const actives = useAnimationsActives()
  if (!actives) return <span className={className} style={{ color: base }}>{children}</span>
  return (
    <span className={cn('inline-block bg-clip-text text-transparent [background-size:250%_100%]',
      auSurvol ? '[animation-play-state:paused] group-hover:[animation-play-state:running] group-focus-visible:[animation-play-state:running]' : '', className)}
      style={{
        backgroundImage: `linear-gradient(110deg, ${base} 40%, ${reflet} 50%, ${base} 60%)`,
        WebkitBackgroundClip: 'text',
        animation: `reflet-lw ${duree}s linear infinite`,
      }}>
      <style>{'@keyframes reflet-lw { from { background-position: 100% 0 } to { background-position: -150% 0 } }'}</style>
      {children}
    </span>
  )
}
