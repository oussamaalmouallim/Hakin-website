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
import { Chargement, EnTeteAdmin, ErreurAdmin, Interrupteur, Pastille, useChargement } from './commun'

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

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-80">
          <span className="sr-only">Rechercher une pièce</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, marque, type…"
            className="w-full rounded-full border border-ligne-forte bg-blanc py-2.5 pl-11 pr-4 text-[14px] outline-none focus:border-encre" />
        </label>
        <div role="group" aria-label="Filtrer les pièces" className="flex flex-wrap gap-2">
          {FILTRES_PRODUITS.map(f => (
            <button key={f.cle} type="button" aria-pressed={filtre === f.cle}
              onClick={() => setSp(s => { if (f.cle === 'tous') s.delete('filtre'); else s.set('filtre', f.cle); return s }, { replace: true })}
              className={cn('rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                filtre === f.cle ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-gris hover:border-encre hover:text-encre')}>
              {f.libelle}
            </button>
          ))}
        </div>
      </div>

      {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
      {liste.enCours && !liste.donnees && <Chargement />}
      {liste.donnees && (
        <>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-gris" aria-live="polite">{visibles.length} pièce{visibles.length > 1 ? 's' : ''}</p>
          {visibles.length === 0 ? (
            <p className="rounded-carte bg-fond-2 p-8 text-center text-[14px] text-gris">
              {liste.donnees.length === 0 ? <>Aucune pièce en base. Importez le catalogue depuis le <Link to="/admin" className="text-encre underline underline-offset-4">tableau de bord</Link>.</> : 'Aucune pièce ne correspond.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibles.map(p => (
                <li key={p.slug} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-carte bg-fond-2 p-3 md:grid-cols-[64px_1fr_140px_120px_auto] md:p-4">
                  <div className="h-14 w-14 overflow-hidden rounded-[10px] bg-blanc md:h-16 md:w-16">
                    {p.images[0] ? <img src={srcImage(p.images[0].src, 480)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <span className="grid h-full w-full place-items-center text-gris-clair"><ImageOff className="h-5 w-5" aria-hidden /></span>}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/admin/produits/${p.slug}`} className="block truncate font-display text-[14px] uppercase leading-[1.2] hover:underline">{p.nom}</Link>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-gris">{p.marque} · {nomType(p.categorie)}{p.genre === 'femme' ? ' · Femmes' : p.genre === 'mixte' ? ' · Mixte' : ''}</p>
                    <p className="mt-1 md:hidden">{p.prixDH === null ? <Pastille ton="danger">Sans prix</Pastille> : <span className="font-display text-[14px] tabular-nums">{formatDH(p.prixDH)}</span>}</p>
                  </div>
                  <div className="hidden md:block">
                    {p.prixDH === null ? <Pastille ton="danger">Sans prix</Pastille> : (
                      <span className="flex flex-col">
                        <span className="font-display text-[15px] tabular-nums">{formatDH(p.prixDH)}</span>
                        {p.prixBarreDH !== null && <span className="text-[12px] text-gris line-through">{formatDH(p.prixBarreDH)}</span>}
                      </span>
                    )}
                  </div>
                  <div className="hidden items-center gap-3 md:flex">
                    <Interrupteur actif={p.publie} onChange={v => basculer(p.slug, v)} libelle={`Visible sur le site : ${p.nom}`} desactive={enCours === p.slug} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris">{p.publie ? 'Visible' : 'Masqué'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="md:hidden"><Interrupteur actif={p.publie} onChange={v => basculer(p.slug, v)} libelle={`Visible sur le site : ${p.nom}`} desactive={enCours === p.slug} /></span>
                    <Link to={`/admin/produits/${p.slug}`} aria-label={`Modifier ${p.nom}`}
                      className="grid h-10 w-10 place-items-center rounded-full border border-ligne-forte text-encre transition-colors hover:bg-encre hover:text-fond">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
