import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceSurveille, StatutService } from './api'
import { Pastille } from './commun'

/** Briques partagées par les onglets de la supervision technique. */

export const DEPOT = 'https://github.com/oussamaalmouallim/Hakin-website'
const refProjet = (import.meta.env.VITE_SUPABASE_URL ?? '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
export const tableauSupabase = refProjet ? `https://supabase.com/dashboard/project/${refProjet}` : 'https://supabase.com/dashboard/projects'
export const ROBOT_EN_RETARD_MIN = 75 // le robot passe toutes les 30 min ; au-delà de 75 min sans nouvelles, l'état devient « inconnu »

export const depuis = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`
  return `il y a ${Math.round(min / 1440)} jours`
}
export const ms = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v} ms`)
export const pourcent = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${String(v).replace('.', ',')} %`)

const STATUTS: Record<StatutService, { libelle: string; ton: 'succes' | 'alerte' | 'danger' | 'neutre' }> = {
  operationnel: { libelle: 'Opérationnel', ton: 'succes' },
  degrade: { libelle: 'Dégradé', ton: 'alerte' },
  indisponible: { libelle: 'Indisponible', ton: 'danger' },
  inconnu: { libelle: 'Inconnu', ton: 'neutre' },
}
export function Statut({ statut }: { statut: StatutService }) {
  return <Pastille ton={STATUTS[statut].ton}>{STATUTS[statut].libelle}</Pastille>
}

/** Le pire statut d'un groupe. Vert seulement si TOUS ses contrôles sont opérationnels ; aucun contrôle = inconnu. */
const ORDRE: StatutService[] = ['indisponible', 'degrade', 'inconnu', 'operationnel']
export function pireStatut(services: ServiceSurveille[]): StatutService {
  if (!services.length) return 'inconnu'
  return ORDRE.find(s => services.some(x => x.statut === s)) ?? 'inconnu'
}

/** Regroupement des contrôles par partie du site (noms des contrôles du robot et de l'admin). */
export const GROUPES_SERVICES: { cle: string; titre: string; texte: string; filtre: (cible: string) => boolean }[] = [
  { cle: 'site', titre: 'Site (frontend)', texte: 'Pages servies par l\'hébergeur, version publiée', filtre: c => c.startsWith('site :') },
  { cle: 'api', titre: 'API et base de données', texte: 'API de Supabase, lecture d\'une table, point de santé', filtre: c => c.startsWith('base :') && !c.includes('Auth') },
  { cle: 'auth', titre: 'Comptes (Auth)', texte: 'Connexion des clients et de l\'admin', filtre: c => c.includes('Auth') },
  { cle: 'photos', titre: 'Photos', texte: 'Stockage des images du catalogue', filtre: c => c.startsWith('stockage') },
  { cle: 'whatsapp', titre: 'WhatsApp', texte: 'Lien de commande (vérifié par le robot seulement)', filtre: c => c.startsWith('WhatsApp') },
]

export function Chiffre({ valeur, libelle, alerte, aide }: { valeur: ReactNode; libelle: string; alerte?: boolean; aide?: string }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-carte bg-fond p-4">
      <span className={cn('font-display text-[26px] leading-none tabular-nums', alerte && 'text-danger')}>{valeur}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris">{libelle}</span>
      {aide && <span className="text-[12px] text-gris">{aide}</span>}
    </div>
  )
}

export function LienExterne({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-encre underline underline-offset-4">{children}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
}

/** Bascule en pastilles (filtres) : un groupe de boutons à état pressé. */
export function Bascules<T extends string>({ libelle, options, valeur, onChange }: { libelle: string; options: { v: T; l: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={libelle}>
      <span className="label mr-1 text-gris">{libelle}</span>
      {options.map(o => (
        <button key={o.v} type="button" aria-pressed={valeur === o.v} onClick={() => onChange(o.v)}
          className={cn('rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]', valeur === o.v ? 'bg-encre text-fond' : 'border border-ligne-forte text-gris')}>{o.l}</button>
      ))}
    </div>
  )
}
