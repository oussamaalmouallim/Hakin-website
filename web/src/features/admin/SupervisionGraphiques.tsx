import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/lightswind/chart'
import { useAnimationsActives } from '@/state/animations'
import type { EtatSupervision, StatistiquesSupervision } from './api'
import { EtatVide } from './commun'
import { SERIE, heure, jourCourt, ms } from './supervisionCommun'

/** Graphiques de la supervision (recharts, via le « chart » Lightswind adapté). Que des mesures réelles : sans données,
 *  un état vide le dit, jamais une courbe d'exemple. Chaque graphique porte un résumé lu par les lecteurs d'écran. */

const axe = { tickLine: false, axisLine: false, tickMargin: 8, fontSize: 11 } as const
const moyenne = (v: (number | null)[]) => { const x = v.filter((n): n is number => n !== null); return x.length ? Math.round(x.reduce((a, b) => a + b, 0) / x.length) : null }

export function GraphiquePerformance({ points, hauteur = 240 }: { points: EtatSupervision['tendance']; hauteur?: number }) {
  const actives = useAnimationsActives()
  if (points.length < 2) return <EtatVide Icone={BarChart3} titre="Pas encore de tendance" texte="Il faut des contrôles sur au moins deux heures. Le robot en fait un toutes les 30 minutes une fois activé." />
  const config: ChartConfig = { site_ms: { label: 'Site', couleur: SERIE.site, format: v => `${v} ms` }, base_ms: { label: 'API et base', couleur: SERIE.api, format: v => `${v} ms` } }
  const echecs = points.reduce((a, p) => a + p.echecs, 0)
  return (
    <>
      <ChartContainer config={config} hauteur={hauteur} resume={`Temps de réponse par heure sur ${points.length} heures : site ${ms(moyenne(points.map(p => p.site_ms)))} en moyenne, API ${ms(moyenne(points.map(p => p.base_ms)))}, ${echecs} contrôle(s) en échec.`}>
        <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            {(['site_ms', 'base_ms'] as const).map(k => (
              <linearGradient key={k} id={`degrade-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--color-${k})`} stopOpacity={0.28} />
                <stop offset="100%" stopColor={`var(--color-${k})`} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="heure" tickFormatter={heure} minTickGap={32} {...axe} />
          <YAxis width={56} tickFormatter={v => `${v} ms`} {...axe} />
          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent formatLabel={l => `${jourCourt(l)} · ${heure(l)}`} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area dataKey="site_ms" type="monotone" stroke="var(--color-site_ms)" strokeWidth={2} fill="url(#degrade-site_ms)" connectNulls isAnimationActive={actives} />
          <Area dataKey="base_ms" type="monotone" stroke="var(--color-base_ms)" strokeWidth={2} fill="url(#degrade-base_ms)" connectNulls isAnimationActive={actives} />
        </AreaChart>
      </ChartContainer>
      {echecs > 0 && <p className="mt-2 text-[12px] text-danger">{echecs} contrôle{echecs > 1 ? 's' : ''} en échec sur la période : détail dans Journaux et incidents.</p>}
    </>
  )
}

export function GraphiqueActivite({ jours, hauteur = 240 }: { jours: StatistiquesSupervision['visites']['par_jour']; hauteur?: number }) {
  const actives = useAnimationsActives()
  if (!jours.length) return <EtatVide Icone={BarChart3} titre="Aucune page vue enregistrée" texte="Les pages vues des visiteurs apparaissent ici dès qu'elles sont comptées (l'administration n'est pas comptée)." />
  const config: ChartConfig = { vues: { label: 'Pages vues', couleur: SERIE.vues }, visiteurs: { label: 'Visiteurs', couleur: SERIE.visiteurs } }
  return (
    <ChartContainer config={config} hauteur={hauteur} resume={`Pages vues par jour sur ${jours.length} jours : ${jours.reduce((a, j) => a + j.vues, 0)} au total.`}>
      <BarChart data={jours} margin={{ left: 0, right: 8, top: 8 }} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="jour" tickFormatter={jourCourt} minTickGap={20} {...axe} />
        <YAxis width={36} allowDecimals={false} {...axe} />
        <ChartTooltip content={<ChartTooltipContent formatLabel={jourCourt} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="vues" fill="var(--color-vues)" radius={[4, 4, 0, 0]} isAnimationActive={actives} />
        <Bar dataKey="visiteurs" fill="var(--color-visiteurs)" radius={[4, 4, 0, 0]} isAnimationActive={actives} />
      </BarChart>
    </ChartContainer>
  )
}

export function GraphiqueLimites({ actions, libelles, hauteur = 220 }: { actions: EtatSupervision['appels_par_action_24h']; libelles: Record<string, string>; hauteur?: number }) {
  const actives = useAnimationsActives()
  if (!actions.length) return <EtatVide Icone={BarChart3} titre="Aucun appel public sur 24 h" texte="Commandes, demandes, pages vues et erreurs envoyées par les visiteurs apparaîtront ici." />
  const config: ChartConfig = { acceptes: { label: 'Acceptés', couleur: SERIE.api }, bloques: { label: 'Bloqués (429)', couleur: SERIE.echec } }
  const donnees = actions.map(a => ({ ...a, nom: libelles[a.action] ?? a.action }))
  return (
    <ChartContainer config={config} hauteur={hauteur} resume={`Appels publics sur 24 heures : ${actions.reduce((a, x) => a + x.acceptes, 0)} acceptés, ${actions.reduce((a, x) => a + x.bloques, 0)} bloqués.`}>
      <BarChart data={donnees} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} {...axe} />
        <YAxis type="category" dataKey="nom" width={120} {...axe} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="acceptes" stackId="a" fill="var(--color-acceptes)" isAnimationActive={actives} />
        <Bar dataKey="bloques" stackId="a" fill="var(--color-bloques)" radius={[0, 4, 4, 0]} isAnimationActive={actives} />
      </BarChart>
    </ChartContainer>
  )
}
