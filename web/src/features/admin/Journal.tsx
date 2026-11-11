import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, RefreshCw } from 'lucide-react'
import { Bouton, useNotifier } from '@/design-system'
import { resumerEntree, type EntreeJournal } from '@/lib/admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { PAGE_JOURNAL, lireJournal } from './api'
import { CarteAdmin, EnTeteAdmin, ErreurAdmin, EtatVide, Pastille, SqueletteAdmin, formatDate, useChargement } from './commun'

const TYPES = [
  { cle: 'tout', libelle: 'Tout', test: () => true },
  { cle: 'produits', libelle: 'Produits', test: (e: EntreeJournal) => e.action.startsWith('produit') },
  { cle: 'commandes', libelle: 'Commandes', test: (e: EntreeJournal) => e.action.includes('commande') },
  { cle: 'reglages', libelle: 'Réglages et textes', test: (e: EntreeJournal) => e.action.startsWith('réglages') },
  { cle: 'connexions', libelle: 'Connexions', test: (e: EntreeJournal) => e.cible === 'connexion' },
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
      <EnTeteAdmin surtitre="Pilotage" titre="Journal"
        texte="Chaque modification faite dans l'administration : produits, prix, visibilité, commandes, réglages et textes. Écrit par la base, il ne peut pas être modifié."
        actions={<Bouton variante="contour" taille="sm" icone={<RefreshCw className="h-3.5 w-3.5" aria-hidden />} chargement={premiere.enCours}
          onClick={() => { setSuite([]); setFinAtteinte(false); void premiere.recharger() }}>Actualiser</Bouton>} />
      <CarteAdmin titre="Modifications" actions={<ToggleGroup libelle="Filtrer le journal" masquerLibelle valeur={type} onChange={setType} options={TYPES.map(t => ({ v: t.cle, l: t.libelle }))} />}>
        {premiere.erreur && <ErreurAdmin message={premiere.erreur} onReessayer={premiere.recharger} />}
        {premiere.enCours && !premiere.donnees && <SqueletteAdmin kpi={0} />}
        {premiere.donnees && (visibles.length === 0 ? (
          <EtatVide Icone={History} titre="Aucune modification enregistrée pour le moment." />
        ) : (
          <Table minWidth={680}>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-40">Quand</TableHead><TableHead className="w-44">Action</TableHead><TableHead>Cible et changement</TableHead></TableRow></TableHeader>
            <TableBody>
              {visibles.map(e => {
                const lien = lienCible(e)
                const resume = resumerEntree(e)
                return (
                  <TableRow key={e.id} className="align-top">
                    <TableCell className="whitespace-nowrap tabular-nums text-gris">{formatDate(e.cree_le)}</TableCell>
                    <TableCell><Pastille point ton={e.action.includes('supprim') ? 'danger' : e.action === 'produit créé' ? 'succes' : 'neutre'}>{e.action}</Pastille></TableCell>
                    <TableCell className="min-w-0">
                      <span className="block truncate font-medium">{lien ? <Link to={lien} className="hover:underline">{e.cible}</Link> : e.cible}</span>
                      {resume && <span className="block break-words text-[12.5px] text-gris">{resume}</span>}
                      <span className="block text-[12px] text-gris">par {e.auteur_email || 'compte supprimé'}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ))}
        {premiere.donnees && !fin && <div className="mt-4 flex justify-center"><Bouton variante="contour" taille="sm" chargement={plus} onClick={chargerPlus}>Afficher plus</Bouton></div>}
      </CarteAdmin>
    </>
  )
}
