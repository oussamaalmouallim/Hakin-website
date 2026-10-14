import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'

export function Prix({ prixDH, prixBarreDH, className, grand }: { prixDH: number | null; prixBarreDH?: number | null; className?: string; grand?: boolean }) {
  if (prixDH === null) return <span className={cn('label whitespace-nowrap text-gris', className)}>Prix sur demande</span>
  return (
    <span className={cn('inline-flex items-baseline gap-3 font-sans tabular-nums', grand ? 'text-[20px]' : 'text-[14px]', className)}>
      <span>{formatDH(prixDH)}</span>
      {prixBarreDH != null && prixBarreDH > prixDH && <s className="text-gris">{formatDH(prixBarreDH)}</s>}
    </span>
  )
}
