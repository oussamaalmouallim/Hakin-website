import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Monogramme H traversé d'une courbe, d'après Template/hero.png (touche H MODE, dégradé beige).
 *  PROVISOIRE : à remplacer par le fichier source du logo (décision D5 du plan). */
export function Monogramme({ className, titre = 'H MODE' }: { className?: string; titre?: string }) {
  const id = `hm-bronze-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 120 100" className={cn('h-10 w-auto', className)} role="img" aria-label={titre}>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--beige-moyen)" /><stop offset="0.55" stopColor="var(--beige-fonce)" /><stop offset="1" stopColor="var(--beige-tres-fonce)" />
        </linearGradient>
      </defs>
      <text x="60" y="84" textAnchor="middle" fontFamily="var(--police-marque)" fontSize="104" fontWeight="500" fill={`url(#${id})`}>H</text>
      <path d="M14 66 C 40 58, 62 40, 106 34 C 76 42, 52 58, 22 70 Z" fill={`url(#${id})`} />
    </svg>
  )
}

/** cloneme: C-01 — logo de l'en-tête sur le modèle de la référence : pastille ronde inclinée de -12°,
 *  nom en Archivo Black 17 px, sous-ligne mono 11 px. Touche H MODE : le « H » de la pastille en Cormorant. */
export function Logotype({ className, clair, sousTitre = 'Casablanca' }: { className?: string; clair?: boolean; sousTitre?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', clair ? 'text-fond' : 'text-encre', className)}>
      <span aria-hidden className={cn('grid h-[38px] w-[38px] shrink-0 -rotate-12 place-items-center rounded-full', clair ? 'bg-fond text-encre' : 'bg-encre text-fond')}>
        <span className="rotate-12 font-marque text-[22px] font-medium leading-none">H</span>
      </span>
      <span className="font-display text-[17px] leading-none">
        H MODE
        <em className={cn('mt-[3px] block font-mono text-[11px] not-italic tracking-[0.18em]', clair ? 'text-fond/60' : 'text-gris')}>{sousTitre}</em>
      </span>
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
