import { useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { HEX_COLORIS, collections, trouverCategorie } from '@/lib/catalogue'
import { PastilleCouleur } from '@/design-system'
import { type Etiquette, type Filtres, FILTRES_VIDES, nbFiltresActifs } from '@/lib/filtres'
import type { facettesCroisees } from '@/lib/filtres'
import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'

type Facettes = ReturnType<typeof facettesCroisees>
const basculerDans = <T extends string>(liste: T[], v: T) => (liste.includes(v) ? liste.filter(x => x !== v) : [...liste, v])
const LIBELLES_ETIQUETTES: Record<Etiquette, string> = { nouveau: 'Nouveau', une: 'À la une' }

/** Groupe de la référence : intitulé mono 11 px gris interlettrage .22em, marge 12 px. */
function Groupe({ titre, droite, children }: { titre: string; droite?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id}>
      <div className="mb-3 flex justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-gris">
        <p id={id}>{titre}</p>{droite}
      </div>
      {children}
    </div>
  )
}

/** Case de la référence : case native 16 px teintée encre, libellé 14 px, ligne de 6 px de marge. Compteur H MODE à droite. */
function Case({ coche, desactive, onChange, libelle, n }: { coche: boolean; desactive?: boolean; onChange: () => void; libelle: ReactNode; n?: number }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3 py-1.5', desactive && 'cursor-not-allowed opacity-40')}>
      <input type="checkbox" checked={coche} disabled={desactive} onChange={onChange} className="h-4 w-4 shrink-0 rounded accent-encre" />
      <span className="flex-1 text-[14px]">{libelle}</span>
      {n !== undefined && <span className="font-mono text-[11px] text-gris">{n}<span className="sr-only"> pièce{n > 1 ? 's' : ''}</span></span>}
    </label>
  )
}

/** Pilule de la référence (tailles) : mono 11 px, `px-3 py-[5px]`, bordure encre 20 %, active = pleine encre. */
function Pilule({ actif, desactive, onClick, children, className }: { actif: boolean; desactive?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={actif} disabled={desactive} onClick={onClick}
      className={cn('rounded-full border px-3 py-[5px] font-mono text-[11px] transition-all',
        actif ? 'border-encre bg-encre text-fond' : 'border-encre/20 text-encre enabled:hover:border-encre disabled:cursor-not-allowed disabled:opacity-40', className)}>
      {children}
    </button>
  )
}

/**
 * cloneme: C-10 — colonne de filtres de la référence (`aside.flex-col.gap-6`) : titre « Filtres » + « Tout effacer »,
 * puis Catégorie (cases), Taille (pilules), Prix max (curseur), Tags (cases).
 * H MODE : Catégorie = type de vêtement ; groupe **Marque** ajouté ; Couleur et Collection conservés (existaient déjà).
 * Un groupe sans données (tailles, prix) est masqué.
 */
export function PanneauFiltres({ filtres, onChange, facettes, sansCollections, sansCategories }: {
  filtres: Filtres; onChange: (f: Filtres) => void; facettes: Facettes; sansCollections?: boolean; sansCategories?: boolean
}) {
  const etiquettes = facettes.etiquettes.filter(e => e.n > 0 || filtres.etiquettes.includes(e.valeur))
  return (
    <aside className="flex flex-col gap-6" aria-label="Filtres">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[16px] uppercase tracking-[0.04em]">Filtres</h3>
        <button type="button" onClick={() => onChange({ ...FILTRES_VIDES, tri: filtres.tri })} disabled={!nbFiltresActifs(filtres)}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-gris transition-colors enabled:hover:text-danger disabled:opacity-50">Tout effacer</button>
      </div>

      {!sansCategories && (
        <Groupe titre="Catégorie">
          {facettes.categories.map(c => {
            const actif = filtres.categories.includes(c.valeur)
            return <Case key={c.valeur} coche={actif} desactive={!c.n && !actif} n={c.n} libelle={trouverCategorie(c.valeur)?.nom ?? c.valeur}
              onChange={() => onChange({ ...filtres, categories: basculerDans(filtres.categories, c.valeur) })} />
          })}
        </Groupe>
      )}

      <Groupe titre="Marque">
        {facettes.marques.map(m => {
          const actif = filtres.marques.includes(m.valeur)
          return <Case key={m.valeur} coche={actif} desactive={!m.n && !actif} n={m.n} libelle={m.valeur}
            onChange={() => onChange({ ...filtres, marques: basculerDans(filtres.marques, m.valeur) })} />
        })}
      </Groupe>

      {(facettes.tailles.length > 0 || filtres.tailles.length > 0) && (
        <Groupe titre="Taille">
          <div className="flex flex-wrap gap-2">
            {facettes.tailles.map(t => (
              <Pilule key={t.valeur} actif={filtres.tailles.includes(t.valeur)} desactive={!t.n && !filtres.tailles.includes(t.valeur)}
                onClick={() => onChange({ ...filtres, tailles: basculerDans(filtres.tailles, t.valeur) })}>{t.valeur}</Pilule>
            ))}
          </div>
        </Groupe>
      )}

      {facettes.prix && facettes.prix.max > facettes.prix.min && (
        <Groupe titre="Prix max" droite={<span>{formatDH(filtres.prixMax ?? facettes.prix.max)}</span>}>
          <input type="range" min={facettes.prix.min} max={facettes.prix.max} step={1} value={filtres.prixMax ?? facettes.prix.max} aria-label="Prix maximum"
            onChange={e => { const v = Number(e.target.value); onChange({ ...filtres, prixMax: facettes.prix && v >= facettes.prix.max ? null : v }) }}
            className="w-full accent-encre" />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-gris"><span>{formatDH(facettes.prix.min)}</span><span>{formatDH(facettes.prix.max)}</span></div>
        </Groupe>
      )}

      <Groupe titre="Couleur">
        <div className="flex flex-wrap gap-2">
          {/* Pastilles de teinte : le nom et le nombre de pièces restent dans l'info-bulle et pour les lecteurs d'écran */}
          {facettes.coloris.map(c => {
            const actif = filtres.coloris.includes(c.valeur)
            const hex = HEX_COLORIS[c.valeur]
            const onClick = () => onChange({ ...filtres, coloris: basculerDans(filtres.coloris, c.valeur) })
            if (!hex) return <Pilule key={c.valeur} actif={actif} desactive={!c.n && !actif} className="capitalize" onClick={onClick}>{c.valeur}</Pilule>
            return (
              <button key={c.valeur} type="button" aria-pressed={actif} disabled={!c.n && !actif} onClick={onClick}
                aria-label={`${c.valeur} (${c.n} pièce${c.n > 1 ? 's' : ''})`} title={`${c.valeur} · ${c.n}`}
                className={cn('grid h-8 w-8 place-items-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-30',
                  actif ? 'border-encre' : 'border-transparent hover:border-ligne-forte')}>
                <span aria-hidden className="h-6 w-6 rounded-full ring-1 ring-inset ring-encre/20" style={{ backgroundColor: hex }} />
              </button>
            )
          })}
        </div>
      </Groupe>

      {(etiquettes.length > 0 || facettes.disponibles > 0 || filtres.disponibles) && (
        <Groupe titre="Tags">
          {etiquettes.map(e => {
            const actif = filtres.etiquettes.includes(e.valeur)
            return <Case key={e.valeur} coche={actif} desactive={!e.n && !actif} n={e.n} libelle={LIBELLES_ETIQUETTES[e.valeur]}
              onChange={() => onChange({ ...filtres, etiquettes: basculerDans(filtres.etiquettes, e.valeur) })} />
          })}
          {(facettes.disponibles > 0 || filtres.disponibles) && (
            <Case coche={filtres.disponibles} n={facettes.disponibles} libelle="Disponible maintenant" onChange={() => onChange({ ...filtres, disponibles: !filtres.disponibles })} />
          )}
        </Groupe>
      )}

      {!sansCollections && (
        <Groupe titre="Collection">
          {collections.map(c => {
            const n = facettes.collections.find(x => x.valeur === c.slug)?.n ?? 0
            const actif = filtres.collections.includes(c.slug)
            return <Case key={c.slug} coche={actif} desactive={!n && !actif} n={n} libelle={c.nom}
              onChange={() => onChange({ ...filtres, collections: basculerDans(filtres.collections, c.slug) })} />
          })}
        </Groupe>
      )}
    </aside>
  )
}

export function PucesActives({ filtres, onChange }: { filtres: Filtres; onChange: (f: Filtres) => void }) {
  if (!nbFiltresActifs(filtres)) return null
  const puces = [
    ...filtres.categories.map(v => ({ v: trouverCategorie(v)?.nom ?? v, retirer: () => onChange({ ...filtres, categories: filtres.categories.filter(x => x !== v) }) })),
    ...filtres.marques.map(v => ({ v, retirer: () => onChange({ ...filtres, marques: filtres.marques.filter(x => x !== v) }) })),
    ...filtres.collections.map(v => ({ v: collections.find(c => c.slug === v)?.nom ?? v, retirer: () => onChange({ ...filtres, collections: filtres.collections.filter(x => x !== v) }) })),
    ...filtres.coloris.map(v => ({ v, couleur: true, retirer: () => onChange({ ...filtres, coloris: filtres.coloris.filter(x => x !== v) }) })),
    ...filtres.tailles.map(v => ({ v: `Taille ${v}`, retirer: () => onChange({ ...filtres, tailles: filtres.tailles.filter(x => x !== v) }) })),
    ...filtres.etiquettes.map(v => ({ v: LIBELLES_ETIQUETTES[v], retirer: () => onChange({ ...filtres, etiquettes: filtres.etiquettes.filter(x => x !== v) }) })),
    ...(filtres.prixMax !== null ? [{ v: `≤ ${formatDH(filtres.prixMax)}`, retirer: () => onChange({ ...filtres, prixMax: null }) }] : []),
    ...(filtres.disponibles ? [{ v: 'Disponible', retirer: () => onChange({ ...filtres, disponibles: false }) }] : []),
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {puces.map(p => (
        <button key={p.v} type="button" onClick={p.retirer} aria-label={`Retirer le filtre ${p.v}`}
          className="inline-flex items-center gap-2 rounded-full border border-encre/20 px-3 py-[5px] font-mono text-[11px] capitalize transition-colors hover:border-encre">
          {'couleur' in p ? <PastilleCouleur nom={p.v} /> : p.v}<X className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}
