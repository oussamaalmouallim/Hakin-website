/**
 * Adapté de Lightswind UI — « chart » (licence MIT, https://lightswind.com/components/chart), sur recharts.
 * Différences avec l'original : les couleurs des séries passent par des variables CSS posées en style du conteneur
 * (pas de balise <style> injectée), info-bulle et légende en français, nombres au format fr-FR, rendu sans animation
 * quand elles sont coupées. Chaque graphique reçoit un `resume` lu par les lecteurs d'écran (les SVG de recharts ne le sont pas).
 */
import { createContext, useContext, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { Legend, ResponsiveContainer, Tooltip, type LegendProps, type TooltipProps } from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<string, { label: string; couleur: string; format?: (v: number) => string }>

const Ctx = createContext<ChartConfig | null>(null)
const useChart = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useChart : à utiliser dans <ChartContainer>')
  return c
}

export function ChartContainer({ config, resume, hauteur = 240, className, children }: { config: ChartConfig; resume: string; hauteur?: number; className?: string; children: ReactElement }) {
  const variables = Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, v.couleur])) as CSSProperties
  return (
    <Ctx.Provider value={config}>
      <figure className={cn('relative w-full text-[11px]', className)} style={variables}>
        <figcaption className="sr-only">{resume}</figcaption>
        <div aria-hidden style={{ height: hauteur }} className="w-full [&_.recharts-cartesian-axis-tick_text]:fill-gris [&_.recharts-cartesian-grid_line]:stroke-ligne [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-fond-3 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-ligne-forte [&_.recharts-surface]:outline-none">
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      </figure>
    </Ctx.Provider>
  )
}

export const ChartTooltip = Tooltip
export const ChartLegend = Legend
const nombre = (v: number) => v.toLocaleString('fr-FR')

export function ChartTooltipContent({ active, payload, label, formatLabel }: TooltipProps<number, string> & { formatLabel?: (l: string) => ReactNode }) {
  const config = useChart()
  if (!active || !payload?.length) return null
  return (
    <div className="grid min-w-[10rem] gap-1.5 rounded-[10px] border border-ligne bg-fond-2 px-3 py-2 text-[12px] shadow-flottant">
      {label !== undefined && <div className="font-medium text-encre">{formatLabel ? formatLabel(String(label)) : String(label)}</div>}
      {payload.map(item => {
        const c = config[String(item.dataKey)]
        if (!c || item.value === null || item.value === undefined) return null
        return (
          <div key={String(item.dataKey)} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: c.couleur }} aria-hidden />
            <span className="flex-1 text-gris">{c.label}</span>
            <span className="font-mono tabular-nums text-encre">{c.format ? c.format(Number(item.value)) : nombre(Number(item.value))}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ChartLegendContent({ payload }: Pick<LegendProps, 'payload'>) {
  const config = useChart()
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-[12px] text-gris">
      {payload.map(item => {
        const c = config[String(item.dataKey)]
        if (!c) return null
        return <span key={String(item.dataKey)} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: c.couleur }} aria-hidden />{c.label}</span>
      })}
    </div>
  )
}
