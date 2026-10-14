import { useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { CaseACocher } from '@/design-system'
import { collections } from '@/lib/catalogue'
import { type Filtres, FILTRES_VIDES, nbFiltresActifs } from '@/lib/filtres'
import type { facettes } from '@/lib/filtres'
import { cn } from '@/lib/utils'

type Facettes = ReturnType<typeof facettes>
const basculerDans = (liste: string[], v: string) => (liste.includes(v) ? liste.filter(x => x !== v) : [...liste, v])

/** Groupe de filtres. Pas de <fieldset>/<legend> : la légende se poserait sur la bordure et décalerait les espacements. */
function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="border-b border-ligne py-6 first:pt-0">
      <p id={id} className="label-large mb-4 text-gris">{titre}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

export function PanneauFiltres({ filtres, onChange, facettes, sansCollections }: { filtres: Filtres; onChange: (f: Filtres) => void; facettes: Facettes; sansCollections?: boolean }) {
  return (
    <div>
      <Groupe titre="Maison">
        {facettes.marques.map(m => (
          <CaseACocher key={m.valeur} checked={filtres.marques.includes(m.valeur)} disabled={!m.n && !filtres.marques.includes(m.valeur)} onChange={() => onChange({ ...filtres, marques: basculerDans(filtres.marques, m.valeur) })}
            label={<span className="flex w-full justify-between gap-4">{m.valeur}<span className="text-gris">{m.n}<span className="sr-only"> pièce{m.n > 1 ? 's' : ''}</span></span></span>} />
        ))}
      </Groupe>
      {!sansCollections && (
        <Groupe titre="Collection">
          {collections.map(c => {
            const n = facettes.collections.find(x => x.valeur === c.slug)?.n ?? 0
            const actif = filtres.collections.includes(c.slug)
            return (
              <CaseACocher key={c.slug} checked={actif} disabled={!n && !actif} onChange={() => onChange({ ...filtres, collections: basculerDans(filtres.collections, c.slug) })}
                label={<span className="flex w-full justify-between gap-4">{c.nom}<span className="text-gris">{n}<span className="sr-only"> pièce{n > 1 ? 's' : ''}</span></span></span>} />
            )
          })}
        </Groupe>
      )}
      <Groupe titre="Coloris">
        <div className="flex flex-wrap gap-2">
          {facettes.coloris.map(c => {
            const actif = filtres.coloris.includes(c.valeur)
            return (
              <button key={c.valeur} type="button" aria-pressed={actif} disabled={!c.n && !actif} onClick={() => onChange({ ...filtres, coloris: basculerDans(filtres.coloris, c.valeur) })}
                className={cn('rounded-full border px-3.5 py-1.5 text-[13px] capitalize transition-colors duration-300', actif ? 'border-encre bg-encre text-nacre' : 'border-ligne enabled:hover:border-encre/50 disabled:cursor-not-allowed disabled:opacity-40')}>
                {c.valeur} <span className={actif ? 'text-nacre/60' : 'text-gris'}>{c.n}</span>
              </button>
            )
          })}
        </div>
      </Groupe>
      {(facettes.tailles.length > 0 || filtres.tailles.length > 0) && <Groupe titre="Taille">
        {facettes.tailles.length ? (
          <div className="flex flex-wrap gap-2">
            {facettes.tailles.map(t => {
              const actif = filtres.tailles.includes(t.valeur)
              return <button key={t.valeur} type="button" aria-pressed={actif} onClick={() => onChange({ ...filtres, tailles: basculerDans(filtres.tailles, t.valeur) })}
                className={cn('h-10 min-w-[3rem] border px-3 text-[13px] transition-colors', actif ? 'border-encre bg-encre text-nacre' : 'border-ligne hover:border-encre/50')}>{t.valeur}</button>
            })}
          </div>
        ) : null}
      </Groupe>}
      {(facettes.disponibles > 0 || filtres.disponibles) && (
        <Groupe titre="Disponibilité">
          <CaseACocher checked={filtres.disponibles} onChange={() => onChange({ ...filtres, disponibles: !filtres.disponibles })}
            label={<span className="flex w-full justify-between gap-4">Disponible maintenant<span className="text-gris">{facettes.disponibles}</span></span>} />
        </Groupe>
      )}
    </div>
  )
}

export function PucesActives({ filtres, onChange }: { filtres: Filtres; onChange: (f: Filtres) => void }) {
  if (!nbFiltresActifs(filtres)) return null
  const puces = [
    ...filtres.marques.map(v => ({ v, retirer: () => onChange({ ...filtres, marques: filtres.marques.filter(x => x !== v) }) })),
    ...filtres.collections.map(v => ({ v: collections.find(c => c.slug === v)?.nom ?? v, retirer: () => onChange({ ...filtres, collections: filtres.collections.filter(x => x !== v) }) })),
    ...filtres.coloris.map(v => ({ v, retirer: () => onChange({ ...filtres, coloris: filtres.coloris.filter(x => x !== v) }) })),
    ...filtres.tailles.map(v => ({ v: `Taille ${v}`, retirer: () => onChange({ ...filtres, tailles: filtres.tailles.filter(x => x !== v) }) })),
    ...(filtres.disponibles ? [{ v: 'Disponible', retirer: () => onChange({ ...filtres, disponibles: false }) }] : []),
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {puces.map(p => (
        <button key={p.v} type="button" onClick={p.retirer} className="inline-flex items-center gap-2 bg-sable-50 px-3 py-1.5 text-[13px] capitalize hover:bg-sable-100" aria-label={`Retirer le filtre ${p.v}`}>
          {p.v}<X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={() => onChange({ ...FILTRES_VIDES, tri: filtres.tri })} className="label ml-2 underline underline-offset-4 hover:text-bronze">Tout effacer</button>
    </div>
  )
}
