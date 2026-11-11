import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertOctagon, AlertTriangle, ChevronRight, Info, ScrollText, Search, XCircle } from 'lucide-react'
import { Tiroir } from '@/design-system'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { cn } from '@/lib/utils'
import { journalTechnique, type CategorieJournal, type EntreeTechnique, type GraviteJournal } from './api'
import { CarteAdmin, EtatVide, GrilleKpi, KpiCarte, Pastille, SqueletteAdmin, ErreurAdmin, formatDate, useChargement } from './commun'
import { Bascules, EnTeteSupervision } from './supervisionCommun'

/** Journaux et incidents : erreurs des navigateurs (frontend), erreurs d'API (backend), contrôles en échec ou lents,
 *  requêtes bloquées, événements de sécurité, déploiements et sauvegardes. Période, type et gravité sont filtrés par
 *  la base (fonction `journal_technique`, 300 lignes au plus) ; la recherche texte filtre ensuite ce qui est chargé. */

const PERIODES = [{ v: '24', l: '24 h' }, { v: '168', l: '7 jours' }, { v: '720', l: '30 jours' }, { v: '2160', l: '90 jours' }] as const
const CATEGORIES: { v: CategorieJournal | 'tout'; l: string }[] = [
  { v: 'tout', l: 'Tout' }, { v: 'site', l: 'Site' }, { v: 'api', l: 'API' }, { v: 'sante', l: 'Santé' },
  { v: 'securite', l: 'Sécurité' }, { v: 'deploiement', l: 'Déploiements' }, { v: 'sauvegarde', l: 'Sauvegardes' },
]
const GRAVITES: { v: GraviteJournal | 'tout'; l: string }[] = [
  { v: 'tout', l: 'Toutes' }, { v: 'critique', l: 'Critique' }, { v: 'erreur', l: 'Erreur' }, { v: 'avertissement', l: 'Avertissement' }, { v: 'info', l: 'Info' },
]
const TON = { critique: 'encre', erreur: 'danger', avertissement: 'alerte', info: 'neutre' } as const
const LIBELLE_CATEGORIE: Record<CategorieJournal, string> = {
  site: 'Site (frontend)', api: 'API (backend)', sante: 'Santé', securite: 'Sécurité', deploiement: 'Déploiement', sauvegarde: 'Sauvegarde', base: 'Base',
}

function Detail({ e, onFermer }: { e: EntreeTechnique | null; onFermer: () => void }) {
  return (
    <Tiroir ouvert={!!e} onFermer={onFermer} titre="Détail de l'événement" label="Détail de l'événement">
      {e && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pastille ton={TON[e.gravite]} point>{e.gravite}</Pastille>
            <Pastille ton="info">{LIBELLE_CATEGORIE[e.categorie]}</Pastille>
          </div>
          <p className="text-[15px] font-medium leading-snug">{e.message}</p>
          <dl className="grid gap-3 text-[13px]">
            <div><dt className="text-[12px] text-gris">Quand</dt><dd className="tabular-nums">{formatDate(e.quand)}</dd></div>
            <div><dt className="text-[12px] text-gris">Origine</dt><dd>{e.origine}</dd></div>
            <div><dt className="text-[12px] text-gris">Détail</dt><dd className="mt-1 whitespace-pre-wrap break-all rounded-bloc border border-ligne bg-fond p-3 font-mono text-[12px]">{e.detail || '—'}</dd></div>
          </dl>
          <p className="text-[12px] leading-[1.5] text-gris">E-mails, numéros, jetons et paramètres d'adresse sont retirés avant l'enregistrement.</p>
        </div>
      )}
    </Tiroir>
  )
}

export function SupervisionJournaux() {
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]['v']>('168')
  const [categorie, setCategorie] = useState<CategorieJournal | 'tout'>('tout')
  const [gravite, setGravite] = useState<GraviteJournal | 'tout'>('tout')
  const [q, setQ] = useState('')
  const [choisi, setChoisi] = useState<EntreeTechnique | null>(null)
  const charger = useCallback(
    () => journalTechnique(Number(periode), categorie === 'tout' ? null : categorie, gravite === 'tout' ? null : gravite),
    [periode, categorie, gravite])
  const journal = useChargement(charger)
  // Nouveau filtre = nouvelle lecture (le premier chargement est déjà fait par useChargement).
  const premier = useRef(true)
  const { recharger } = journal
  useEffect(() => { if (premier.current) { premier.current = false; return } void recharger() }, [charger, recharger])
  const lignes = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (journal.donnees ?? []).filter(e => !t || `${e.message} ${e.detail} ${e.origine}`.toLowerCase().includes(t))
  }, [journal.donnees, q])
  const compte = (g: GraviteJournal) => (journal.donnees ?? []).filter(e => e.gravite === g).length

  return (
    <>
      <EnTeteSupervision titre="Journaux et incidents" texte="Erreurs du site et de l'API, contrôles en échec ou lents, requêtes bloquées, clés admin erronées, déploiements et sauvegardes. Conservation : 30 jours (90 pour la sécurité et les déploiements)."
        enCours={journal.enCours} onActualiser={journal.recharger} />
      {journal.donnees && (
        <div className="mb-5">
          <GrilleKpi>
            <KpiCarte Icone={AlertOctagon} libelle="Critiques" valeur={compte('critique')} ton={compte('critique') ? 'danger' : 'normal'} />
            <KpiCarte Icone={XCircle} libelle="Erreurs" valeur={compte('erreur')} ton={compte('erreur') ? 'danger' : 'normal'} />
            <KpiCarte Icone={AlertTriangle} libelle="Avertissements" valeur={compte('avertissement')} ton={compte('avertissement') ? 'alerte' : 'normal'} />
            <KpiCarte Icone={Info} libelle="Informations" valeur={compte('info')} />
          </GrilleKpi>
        </div>
      )}
      <CarteAdmin titre="Événements" texte="Cliquez sur une ligne pour voir son détail.">
        <div className="mb-5 flex flex-col gap-3 rounded-bloc border border-ligne bg-fond p-3.5">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Bascules libelle="Période" options={[...PERIODES]} valeur={periode} onChange={setPeriode} />
            <Bascules libelle="Gravité" options={GRAVITES} valeur={gravite} onChange={setGravite} />
          </div>
          <Bascules libelle="Type" options={CATEGORIES} valeur={categorie} onChange={setCategorie} />
          <label className="relative block md:max-w-sm">
            <span className="sr-only">Rechercher dans les événements</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un message, une origine…"
              className="h-9 w-full rounded-bloc border border-ligne-forte bg-fond-2 pl-9 pr-3 text-[13px] outline-none focus:border-encre" />
          </label>
        </div>
        {journal.erreur && <ErreurAdmin message={journal.erreur} onReessayer={journal.recharger} />}
        {journal.enCours && !journal.donnees && <SqueletteAdmin kpi={0} />}
        {journal.donnees && (lignes.length === 0
          ? <EtatVide Icone={ScrollText} titre="Aucun événement pour ces filtres." texte="Élargissez la période ou retirez un filtre." />
          : (
            <>
              <p className="mb-2 text-[12px] text-gris" aria-live="polite">{lignes.length} événement{lignes.length > 1 ? 's' : ''}{journal.donnees.length === 300 ? ' (les 300 plus récents)' : ''}.</p>
              <Table minWidth={760}>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="w-28">Gravité</TableHead><TableHead className="w-32">Type</TableHead><TableHead>Message</TableHead><TableHead className="w-40">Quand</TableHead><TableHead className="w-8"><span className="sr-only">Détail</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lignes.map((e, i) => (
                    <TableRow key={`${e.quand}-${i}`} className={cn('cursor-pointer', e.gravite === 'critique' && 'bg-danger/[0.03]')} onClick={() => setChoisi(e)}>
                      <TableCell><Pastille ton={TON[e.gravite]} point>{e.gravite}</Pastille></TableCell>
                      <TableCell className="text-[12px] text-gris">{LIBELLE_CATEGORIE[e.categorie]}</TableCell>
                      <TableCell>
                        <button type="button" onClick={ev => { ev.stopPropagation(); setChoisi(e) }} className="text-left font-medium hover:underline">{e.message}</button>
                        <span className="block truncate text-[12px] text-gris">{e.origine}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-gris">{formatDate(e.quand)}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-gris-clair" aria-hidden /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ))}
      </CarteAdmin>
      <Detail e={choisi} onFermer={() => setChoisi(null)} />
    </>
  )
}
