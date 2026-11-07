import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Bouton, useNotifier } from '@/design-system'
import { resumerEntree, type EntreeJournal } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { PAGE_JOURNAL, lireJournal } from './api'
import { Chargement, EnTeteAdmin, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'

const TYPES = [
  { cle: 'tout', libelle: 'Tout', test: () => true },
  { cle: 'produits', libelle: 'Produits', test: (e: EntreeJournal) => e.action.startsWith('produit') },
  { cle: 'commandes', libelle: 'Commandes', test: (e: EntreeJournal) => e.action.includes('commande') },
  { cle: 'reglages', libelle: 'Réglages et textes', test: (e: EntreeJournal) => e.action.startsWith('réglages') },
] as const

const lienCible = (e: EntreeJournal) =>
  e.action.startsWith('produit') && e.action !== 'produit supprimé' ? `/admin/produits/${e.cible}`
    : e.action === 'statut de commande' ? `/admin/commandes?ref=${encodeURIComponent(e.cible)}`
      : e.cible === 'boutique' ? '/admin/reglages' : e.cible === 'textes' ? '/admin/textes' : null

/** Journal : chaque changement fait dans l'administration, qui l'a fait et quand (écrit par la base, non modifiable). */
export function Journal() {
  const notifier = useNotifier()
  const premiere = useChargement(() => lireJournal())
  const [suite, setSuite] = useState<EntreeJournal[]>([])
  const [finAtteinte, setFinAtteinte] = useState(false)
  const [plus, setPlus] = useState(false)
  const [type, setType] = useState<(typeof TYPES)[number]['cle']>('tout')
  const toutes = useMemo(() => [...(premiere.donnees ?? []), ...suite], [premiere.donnees, suite])
  const visibles = toutes.filter(TYPES.find(t => t.cle === type)!.test)
  const fin = finAtteinte || (premiere.donnees !== null && premiere.donnees.length < PAGE_JOURNAL)

  const chargerPlus = async () => {
    setPlus(true)
    try {
      const page = await lireJournal(toutes[toutes.length - 1]?.id)
      setSuite(s => [...s, ...page])
      if (page.length < PAGE_JOURNAL) setFinAtteinte(true)
    } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }) }
    finally { setPlus(false) }
  }

  return (
    <>
      <EnTeteAdmin surtitre="Suivi" titre="Journal"
        texte="Chaque modification faite dans l'administration : produits, prix, visibilité, commandes, réglages et textes. Écrit par la base, il ne peut pas être modifié."
        actions={<Bouton variante="contour" taille="sm" icone={<RefreshCw className="h-3.5 w-3.5" aria-hidden />} chargement={premiere.enCours}
          onClick={() => { setSuite([]); setFinAtteinte(false); void premiere.recharger() }}>Actualiser</Bouton>} />
      <div role="group" aria-label="Filtrer le journal" className="mb-6 flex flex-wrap gap-2">
        {TYPES.map(t => (
          <button key={t.cle} type="button" aria-pressed={type === t.cle} onClick={() => setType(t.cle)}
            className={cn('rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
              type === t.cle ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-gris hover:border-encre hover:text-encre')}>{t.libelle}</button>
        ))}
      </div>
      {premiere.erreur && <ErreurAdmin message={premiere.erreur} onReessayer={premiere.recharger} />}
      {premiere.enCours && !premiere.donnees && <Chargement />}
      {premiere.donnees && (visibles.length === 0 ? (
        <p className="rounded-carte bg-fond-2 p-8 text-center text-[14px] text-gris">Aucune modification enregistrée pour le moment.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {visibles.map(e => {
            const lien = lienCible(e)
            const resume = resumerEntree(e)
            return (
              <li key={e.id} className="grid gap-2 rounded-carte bg-fond-2 p-4 md:grid-cols-[170px_190px_1fr] md:gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gris">{formatDate(e.cree_le)}</span>
                <span><Pastille ton={e.action.includes('supprim') ? 'danger' : e.action === 'produit créé' ? 'succes' : 'neutre'}>{e.action}</Pastille></span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px]">{lien ? <Link to={lien} className="underline underline-offset-4 hover:text-encre">{e.cible}</Link> : e.cible}</span>
                  {resume && <span className="block break-words text-[13px] text-gris">{resume}</span>}
                  <span className="block text-[12px] text-gris">par {e.auteur_email || 'compte supprimé'}</span>
                </span>
              </li>
            )
          })}
        </ol>
      ))}
      {premiere.donnees && !fin && <div className="mt-6"><Bouton variante="contour" chargement={plus} onClick={chargerPlus}>Afficher plus</Bouton></div>}
    </>
  )
}
