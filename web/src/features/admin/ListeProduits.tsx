import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ImageOff, Pencil, Plus, Search } from 'lucide-react'
import { BoutonLien, useNotifier } from '@/design-system'
import { FILTRES_PRODUITS, filtrerProduitsAdmin, type FiltreProduits } from '@/lib/admin'
import { categories, srcImage } from '@/lib/catalogue'
import { chargerDonnees } from '@/lib/donnees'
import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'
import { changerPublication, listerProduits } from './api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { CarteAdmin, EnTeteAdmin, ErreurAdmin, EtatVide, Interrupteur, Pastille, SqueletteAdmin, useChargement } from './commun'
import { CarteImport } from './ImportCatalogue'

const nomType = (slug: string) => categories.find(c => c.slug === slug)?.nom ?? slug

export function ListeProduits() {
  const notifier = useNotifier()
  const [sp, setSp] = useSearchParams()
  const filtre = (FILTRES_PRODUITS.some(f => f.cle === sp.get('filtre')) ? sp.get('filtre') : 'tous') as FiltreProduits
  const [q, setQ] = useState('')
  const liste = useChargement(listerProduits)
  const visibles = useMemo(() => filtrerProduitsAdmin(liste.donnees ?? [], q, filtre), [liste.donnees, q, filtre])
  const [enCours, setEnCours] = useState<string | null>(null)

  const basculer = async (slug: string, publie: boolean) => {
    if (!liste.donnees) return
    setEnCours(slug)
    try {
      await changerPublication(slug, publie)
      liste.remplacer(liste.donnees.map(p => (p.slug === slug ? { ...p, publie } : p)))
      void chargerDonnees()
      notifier({ ton: 'succes', message: publie ? 'Pièce visible sur le site.' : 'Pièce masquée du site.' })
    } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }) }
    finally { setEnCours(null) }
  }

  return (
    <>
      <EnTeteAdmin surtitre="Catalogue" titre="Produits et prix"
        texte="Prix, tailles, coloris, photos et visibilité de chaque pièce. Une pièce sans prix s'affiche « Prix sur demande » et se commande sur WhatsApp."
        actions={<BoutonLien to="/admin/produits/nouveau" variante="accent" icone={<Plus className="h-4 w-4" aria-hidden />}>Nouvelle pièce</BoutonLien>} />

      <CarteAdmin sansMarge titre="Catalogue" actions={<ToggleGroup libelle="Filtrer les pièces" masquerLibelle valeur={filtre}
          options={FILTRES_PRODUITS.map(f => ({ v: f.cle, l: f.libelle }))}
          onChange={v => setSp(s => { if (v === 'tous') s.delete('filtre'); else s.set('filtre', v); return s }, { replace: true })} />}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
          <label className="relative block w-full md:w-80">
            <span className="sr-only">Rechercher une pièce</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, marque, type…"
              className="h-9 w-full rounded-bloc border border-ligne-forte bg-fond-2 pl-9 pr-3 text-[13px] outline-none focus:border-encre" />
          </label>
          {liste.donnees && <p className="text-[12.5px] text-gris" aria-live="polite">{visibles.length} pièce{visibles.length > 1 ? 's' : ''}</p>}
        </div>
        <div className="px-5 pb-5">
          {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
          {liste.enCours && !liste.donnees && <SqueletteAdmin kpi={0} lignes={8} />}
          {liste.donnees && (liste.donnees.length === 0 ? <CarteImport onImporte={liste.recharger} /> : visibles.length === 0 ? (
            <EtatVide Icone={Search} titre="Aucune pièce ne correspond." texte="Changez la recherche ou le filtre." />
          ) : (
            <Table minWidth={720}>
              <TableHeader><TableRow className="hover:bg-transparent">
                <TableHead className="w-[68px]"><span className="sr-only">Photo</span></TableHead><TableHead>Pièce</TableHead><TableHead>Prix</TableHead><TableHead>Visible sur le site</TableHead><TableHead className="w-14"><span className="sr-only">Modifier</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {visibles.map(p => (
                  <TableRow key={p.slug} className={cn(!p.publie && 'bg-fond/60')}>
                    <TableCell>
                      <div className="h-12 w-12 overflow-hidden rounded-[9px] border border-ligne bg-fond">
                        {p.images[0] ? <img src={srcImage(p.images[0].src, 480)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          : <span className="grid h-full w-full place-items-center text-gris-clair"><ImageOff className="h-4 w-4" aria-hidden /></span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[340px]">
                      <Link to={`/admin/produits/${p.slug}`} className="block truncate font-medium hover:underline">{p.nom}</Link>
                      <p className="mt-0.5 truncate text-[12px] text-gris">{p.marque} · {nomType(p.categorie)}{p.genre === 'femme' ? ' · Femmes' : p.genre === 'mixte' ? ' · Mixte' : ''}</p>
                    </TableCell>
                    <TableCell>
                      {p.prixDH === null ? <Pastille ton="danger" point>Sans prix</Pastille> : (
                        <span className="flex flex-col">
                          <span className="font-medium tabular-nums">{formatDH(p.prixDH)}</span>
                          {p.prixBarreDH !== null && <span className="text-[12px] text-gris line-through">{formatDH(p.prixBarreDH)}</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <Interrupteur actif={p.publie} onChange={v => basculer(p.slug, v)} libelle={`Visible sur le site : ${p.nom}`} desactive={enCours === p.slug} />
                        <span className="text-[12.5px] text-gris">{p.publie ? 'Visible' : 'Masqué'}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/produits/${p.slug}`} aria-label={`Modifier ${p.nom}`}
                        className="grid h-8 w-8 place-items-center rounded-[8px] border border-ligne text-encre transition-colors hover:bg-encre hover:text-fond-2">
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
        </div>
      </CarteAdmin>
    </>
  )
}
