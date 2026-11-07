import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'

/** cloneme: C-09 — prix de la référence : Archivo Black 15 px, prix barré avant, 13 px gris (Relevé).
 *  `prixDH: null` → « Prix sur demande » (ADR 0002). */
export function Prix({ prixDH, prixBarreDH, className, grand }: { prixDH: number | null; prixBarreDH?: number | null; className?: string; grand?: boolean }) {
  if (prixDH === null) return <span className={cn('whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] text-gris', className)}>Prix sur demande</span>
  return (
    <span className={cn('inline-flex items-baseline font-display tabular-nums', grand ? 'text-[24px]' : 'text-[15px]', className)}>
      {prixBarreDH != null && prixBarreDH > prixDH && <s className="mr-2 font-sans text-[13px] font-normal text-gris">{formatDH(prixBarreDH)}</s>}
      <span>{formatDH(prixDH)}</span>
    </span>
  )
}
