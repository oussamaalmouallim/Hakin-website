import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Cadre, ImageProduit, Revelation } from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { EnTetePage } from '@/components/EnTetePage'
import { collections, produitsDeCollection, trouverCollection } from '@/lib/catalogue'
import { Page404 } from '@/features/infos/Page404'

export function PageCollections() {
  return (
    <>
      <EnTetePage surtitre="Collections" titre="Des univers, pièce par pièce" texte="Chaque collection raconte une inspiration : les signatures des grandes maisons, ou la lumière de la Riviera."
        ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Collections' }]} />
      <div className="conteneur flex flex-col gap-24 lg:gap-36">
        {collections.map((c, i) => (
          <Revelation key={c.slug}>
            <Link to={`/collections/${c.slug}`} className={`group grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <Cadre className="aspect-[4/5]"><ImageProduit src={c.image} alt={`Collection ${c.nom}`} zoomSurvol className="absolute inset-0" tailles="(min-width: 1024px) 50vw, 100vw" /></Cadre>
              <div>
                <p className="label text-bronze">{String(i + 1).padStart(2, '0')} — {produitsDeCollection(c.slug).length} pièces</p>
                <h2 className="titre-1 mt-5">{c.nom}</h2>
                <p className="mt-6 max-w-md text-[17px] text-gris">{c.recit}</p>
                <span className="lien-souligne label mt-10">Explorer la collection <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          </Revelation>
        ))}
      </div>
    </>
  )
}

export function PageCollection() {
  const { slug = '' } = useParams()
  const c = trouverCollection(slug)
  if (!c) return <Page404 />
  const liste = produitsDeCollection(c.slug)
  return (
    <>
      <section className="relative h-[70svh] min-h-[480px] overflow-hidden">
        <ImageProduit src={c.image} alt={`Collection ${c.nom}`} prioritaire className="absolute inset-0" tailles="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-encre/70 via-encre/20 to-encre/10" />
        <div className="conteneur relative flex h-full flex-col justify-end pb-14 text-nacre">
          <Revelation>
            <p className="label text-nacre/80">Collection · {liste.length} pièces</p>
            <h1 className="titre-display mt-4">{c.nom}</h1>
            <p className="mt-6 max-w-lg text-[17px] text-nacre/85">{c.recit}</p>
          </Revelation>
        </div>
      </section>
      <div className="conteneur mt-20">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3">
          {liste.map((p, i) => <li key={p.slug}><Revelation delai={(i % 3) * 0.08}><CarteProduit produit={p} /></Revelation></li>)}
        </ul>
        <div className="mt-20 flex justify-center gap-8">
          {collections.filter(x => x.slug !== c.slug).map(x => (
            <Link key={x.slug} to={`/collections/${x.slug}`} className="lien-souligne label">Collection {x.nom} <ArrowRight className="h-3.5 w-3.5" /></Link>
          ))}
        </div>
      </div>
    </>
  )
}
