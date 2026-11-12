import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Bouton } from '@/design-system'
import { Badge } from '@/components/lightswind/badge'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { cn } from '@/lib/utils'
import { etatSupervision, statistiquesSupervision, type ServiceSurveille, type StatutService } from './api'
import { EnTeteAdmin, ErreurAdmin, SqueletteAdmin, useChargement } from './commun'

/** Briques partagées par les cinq pages de la supervision technique. */

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
export const joursDepuis = (iso: string | null | undefined) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null)
export const ms = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v} ms`)
export const pourcent = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${String(v).replace('.', ',')} %`)
export const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const jourCourt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })

export const STATUTS: Record<StatutService, { libelle: string; ton: 'succes' | 'alerte' | 'danger' | 'neutre' }> = {
  operationnel: { libelle: 'Opérationnel', ton: 'succes' },
  degrade: { libelle: 'Dégradé', ton: 'alerte' },
  indisponible: { libelle: 'Indisponible', ton: 'danger' },
  inconnu: { libelle: 'Inconnu', ton: 'neutre' },
}
export function Statut({ statut, taille = 'sm' }: { statut: StatutService; taille?: 'sm' | 'md' }) {
  return <Badge variant={STATUTS[statut].ton} point size={taille}>{STATUTS[statut].libelle}</Badge>
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

/** Couleurs des séries de graphiques : tokens de l'admin (tokens.css § .theme-admin). */
export const SERIE = { site: 'var(--admin-serie-1)', api: 'var(--admin-serie-2)', echec: 'var(--admin-serie-3)', vues: 'var(--admin-serie-2)', visiteurs: 'var(--admin-serie-1)' }

export function LienExterne({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-[8px] border border-ligne bg-fond-2 px-3 py-1.5 text-[12.5px] font-medium text-encre transition-colors hover:border-ligne-forte hover:bg-fond-3">
      {children}<ExternalLink className="h-3.5 w-3.5 text-gris" aria-hidden /><span className="sr-only"> (nouvel onglet)</span>
    </a>
  )
}

/** Filtre à choix unique (Lightswind « toggle-group ») : un groupe nommé de boutons à état pressé. */
export function Bascules<T extends string>({ libelle, options, valeur, onChange }: { libelle: string; options: { v: T; l: string }[]; valeur: T; onChange: (v: T) => void }) {
  return <ToggleGroup libelle={libelle} options={options} valeur={valeur} onChange={onChange} />
}

/** Données communes aux pages Vue d'ensemble, Santé, Sécurité et Maintenance : état calculé par la base et statistiques. */
export function useSupervision() {
  const d = useChargement(async () => {
    const [etat, stats] = await Promise.all([etatSupervision(), statistiquesSupervision()])
    return { etat, stats, lu: new Date().toISOString() }
  })
  return d
}

/** Moment de la dernière lecture, rafraîchi chaque minute (« il y a 3 min »). */
function MisAJour({ iso }: { iso: string }) {
  const [, setTic] = useState(0)
  useEffect(() => { const t = window.setInterval(() => setTic(n => n + 1), 60_000); return () => window.clearInterval(t) }, [])
  return <span className="hidden text-[12px] text-gris md:inline">Mis à jour {depuis(iso)}</span>
}

/** En-tête d'une page de la supervision : titre, explication, « Actualiser », et ses propres actions. */
export function EnTeteSupervision({ titre, texte, enCours, onActualiser, lu, actions }: {
  titre: string; texte: ReactNode; enCours: boolean; onActualiser: () => void; lu?: string; actions?: ReactNode
}) {
  return (
    <EnTeteAdmin surtitre="Supervision technique" titre={titre} texte={texte}
      actions={<div className="flex flex-wrap items-center gap-2">
        {lu && <MisAJour iso={lu} />}
        {actions}
        <Bouton variante="contour" onClick={onActualiser} disabled={enCours}><RefreshCw className={cn('h-4 w-4', enCours && 'animate-spin')} aria-hidden />Actualiser</Bouton>
      </div>} />
  )
}

/** Cadre de page : erreur, squelette au premier chargement, puis le contenu avec les données. */
export function CorpsSupervision<T>({ d, kpi, children }: { d: { donnees: T | null; erreur: string | null; enCours: boolean; recharger: () => void }; kpi?: number; children: (x: T) => ReactNode }) {
  return (
    <>
      {d.erreur && <ErreurAdmin message={d.erreur} onReessayer={d.recharger} />}
      {d.enCours && !d.donnees && <SqueletteAdmin kpi={kpi} />}
      {d.donnees && children(d.donnees)}
    </>
  )
}

/** Titre de section dans une page (au-dessus d'une grille de cartes). */
export function TitreSection({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-2 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gris">{children}</h2>
      {action}
    </div>
  )
}
