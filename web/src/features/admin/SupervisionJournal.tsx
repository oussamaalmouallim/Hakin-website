import { useCallback, useEffect, useRef, useState } from 'react'
import { journalTechnique, type CategorieJournal, type GraviteJournal } from './api'
import { CarteAdmin, Chargement, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'
import { Bascules } from './supervisionCommun'

/** Journal technique unifié : erreurs des navigateurs, erreurs d'API, contrôles en échec ou lents, requêtes bloquées,
 *  événements de sécurité, déploiements et sauvegardes. Tout est filtré par la base (fonction `journal_technique`). */

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
  site: 'site', api: 'API', sante: 'santé', securite: 'sécurité', deploiement: 'déploiement', sauvegarde: 'sauvegarde', base: 'base',
}

export function JournalTechnique() {
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]['v']>('168')
  const [categorie, setCategorie] = useState<CategorieJournal | 'tout'>('tout')
  const [gravite, setGravite] = useState<GraviteJournal | 'tout'>('tout')
  const charger = useCallback(
    () => journalTechnique(Number(periode), categorie === 'tout' ? null : categorie, gravite === 'tout' ? null : gravite),
    [periode, categorie, gravite])
  const journal = useChargement(charger)
  // Nouveau filtre = nouvelle lecture (le premier chargement est déjà fait par useChargement).
  const premier = useRef(true)
  const { recharger } = journal
  useEffect(() => { if (premier.current) { premier.current = false; return } void recharger() }, [charger, recharger])
  return (
    <CarteAdmin titre="Journal technique" texte="Erreurs du site et de l'API, contrôles en échec ou lents, requêtes bloquées, clés admin erronées, déploiements et sauvegardes. Les e-mails, numéros et jetons sont retirés avant l'enregistrement. Conservation : 30 jours (90 pour les événements de sécurité et de déploiement).">
      <div className="mb-5 flex flex-col gap-3">
        <Bascules libelle="Période" options={[...PERIODES]} valeur={periode} onChange={setPeriode} />
        <Bascules libelle="Type" options={CATEGORIES} valeur={categorie} onChange={setCategorie} />
        <Bascules libelle="Gravité" options={GRAVITES} valeur={gravite} onChange={setGravite} />
      </div>
      {journal.erreur && <ErreurAdmin message={journal.erreur} onReessayer={journal.recharger} />}
      {journal.enCours && !journal.donnees && <Chargement />}
      {journal.donnees && (journal.donnees.length === 0
        ? <p className="text-[13px] text-gris">Aucun événement pour ces filtres.</p>
        : (
          <>
            <p className="mb-2 text-[12px] text-gris">{journal.donnees.length} événement{journal.donnees.length > 1 ? 's' : ''}{journal.donnees.length === 300 ? ' (les 300 plus récents)' : ''}.</p>
            <ul className="divide-y divide-ligne">
              {journal.donnees.map((e, i) => (
                <li key={`${e.quand}-${i}`} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <Pastille ton={TON[e.gravite]}>{e.gravite}</Pastille>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gris">{LIBELLE_CATEGORIE[e.categorie]}</span>
                      <span className="min-w-0 flex-1 break-words">{e.message}</span>
                      <span className="tabular-nums text-gris">{formatDate(e.quand)}</span>
                    </summary>
                    <dl className="mt-2 grid gap-1 pl-1 text-[12px] text-gris sm:grid-cols-2">
                      <div>Origine : <span className="text-encre">{e.origine}</span></div>
                      <div className="sm:col-span-2">Détail : <span className="break-all text-encre">{e.detail || '—'}</span></div>
                    </dl>
                  </details>
                </li>
              ))}
            </ul>
          </>
        ))}
    </CarteAdmin>
  )
}
