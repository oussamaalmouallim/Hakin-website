import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Inbox, MessageCircle, MinusCircle, RefreshCw } from 'lucide-react'
import { Bouton, useNotifier } from '@/design-system'
import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'
import { listerDemandes, suivreDemande, type DemandeWhatsApp, type StatutDemande } from './api'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { CarteAdmin, EnTeteAdmin, ErreurAdmin, EtatVide, GrilleKpi, KpiCarte, Pastille, SqueletteAdmin, formatDate, useChargement } from './commun'

/** Demandes WhatsApp : un visiteur a cliqué un bouton WhatsApp d'une fiche. Contacts commerciaux à traiter,
 *  distincts des commandes : le site sait que WhatsApp a été ouvert, pas que le message est parti. */

const STATUTS_DEMANDE: { cle: StatutDemande; libelle: string }[] = [
  { cle: 'a_traiter', libelle: 'À traiter' },
  { cle: 'traitee', libelle: 'Traitée' },
  { cle: 'sans_suite', libelle: 'Sans suite' },
]
const MOTIFS: Record<DemandeWhatsApp['motif'], string> = {
  renseignement: 'Prix et disponibilité',
  commande: 'Veut commander',
  alerte_stock: 'Prévenir si retour en stock',
  conseil_taille: 'Conseil de taille',
}
const tonStatut = (s: StatutDemande) => (s === 'a_traiter' ? 'accent' as const : s === 'traitee' ? 'succes' as const : 'neutre' as const)

function Ligne({ d, onMaj }: { d: DemandeWhatsApp; onMaj: (d: DemandeWhatsApp) => void }) {
  const notifier = useNotifier()
  const [note, setNote] = useState(d.note)
  const [envoi, setEnvoi] = useState(false)
  const changer = async (statut: StatutDemande) => {
    setEnvoi(true)
    try {
      await suivreDemande(d.id, statut, note)
      onMaj({ ...d, statut, note: note.trim(), traitee_le: statut === 'a_traiter' ? null : new Date().toISOString() })
      notifier({ ton: 'succes', message: `Demande marquée « ${STATUTS_DEMANDE.find(s => s.cle === statut)!.libelle} ».` })
    } catch (e) { notifier({ ton: 'erreur', message: String((e as Error)?.message ?? e) }) } finally { setEnvoi(false) }
  }
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/produits/${encodeURIComponent(d.slug)}`} className="text-[14px] font-medium hover:underline">{d.nom_produit}</Link>
          <p className="mt-1 text-[13px] text-gris">
            {MOTIFS[d.motif]}
            {d.coloris && <> · couleur {d.coloris}</>}
            {d.taille && <> · taille {d.taille}</>}
            {d.prix_dh !== null && <> · affiché {formatDH(d.prix_dh)}</>}
          </p>
          <p className="mt-1 text-[12px] text-gris">Clic le {formatDate(d.cree_le)}{d.traitee_le && <> · suivi le {formatDate(d.traitee_le)}</>}</p>
        </div>
        <Pastille point ton={tonStatut(d.statut)}>{STATUTS_DEMANDE.find(s => s.cle === d.statut)!.libelle}</Pastille>
      </div>
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
        <label className="flex-1">
          <span className="sr-only">Note de suivi</span>
          <input value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="Note : réponse donnée, client, suite…"
            className="h-9 w-full rounded-bloc border border-ligne-forte bg-fond-2 px-3 text-[13px] outline-none focus:border-encre" />
        </label>
        <div className="inline-flex flex-wrap gap-0.5 rounded-bloc border border-ligne bg-fond-3/60 p-0.5" role="group" aria-label="Suivi de la demande">
          {STATUTS_DEMANDE.map(s => (
            <button key={s.cle} type="button" disabled={envoi} aria-pressed={d.statut === s.cle} onClick={() => void changer(s.cle)}
              className={cn('rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50',
                d.statut === s.cle ? 'bg-fond-2 text-encre shadow-carte ring-1 ring-ligne' : 'text-gris hover:text-encre')}>{s.libelle}</button>
          ))}
        </div>
      </div>
    </li>
  )
}

export function Demandes() {
  const liste = useChargement(listerDemandes)
  const [filtre, setFiltre] = useState<StatutDemande | 'toutes'>('a_traiter')
  const visibles = useMemo(() => (liste.donnees ?? []).filter(d => filtre === 'toutes' || d.statut === filtre), [liste.donnees, filtre])
  const compte = (s: StatutDemande) => (liste.donnees ?? []).filter(d => d.statut === s).length
  return (
    <>
      <EnTeteAdmin surtitre="Ventes" titre="Demandes WhatsApp"
        texte="Chaque clic sur un bouton WhatsApp d'une fiche produit : la pièce, la couleur et la taille choisies. Ce ne sont pas des commandes — le client a ouvert WhatsApp, son message n'est peut-être pas parti. Retrouvez-le dans WhatsApp, puis notez la suite ici."
        actions={<Bouton variante="contour" taille="sm" icone={<RefreshCw className="h-3.5 w-3.5" aria-hidden />} chargement={liste.enCours} onClick={liste.recharger}>Actualiser</Bouton>} />
      {liste.donnees && (
        <div className="mb-5">
          <GrilleKpi colonnes={3}>
            <KpiCarte Icone={Inbox} libelle="À traiter" valeur={compte('a_traiter')} ton={compte('a_traiter') > 0 ? 'danger' : 'normal'} />
            <KpiCarte Icone={CheckCircle2} libelle="Traitées" valeur={compte('traitee')} />
            <KpiCarte Icone={MinusCircle} libelle="Sans suite" valeur={compte('sans_suite')} />
          </GrilleKpi>
        </div>
      )}
      <CarteAdmin titre="Demandes" actions={<ToggleGroup libelle="Filtrer par suivi" masquerLibelle valeur={filtre} onChange={setFiltre}
          options={[{ v: 'toutes' as StatutDemande | 'toutes', l: 'Toutes' }, ...STATUTS_DEMANDE.map(s => ({ v: s.cle as StatutDemande | 'toutes', l: s.libelle, n: liste.donnees ? compte(s.cle) : undefined }))]} />}>
        {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
        {liste.enCours && !liste.donnees && <SqueletteAdmin kpi={0} />}
        {liste.donnees && (visibles.length === 0
          ? <EtatVide Icone={MessageCircle} titre={liste.donnees.length === 0 ? 'Aucune demande pour le moment.' : 'Aucune demande dans ce filtre.'} />
          : <ul className="divide-y divide-ligne">
              {visibles.map(d => <Ligne key={d.id} d={d} onMaj={m => liste.remplacer(liste.donnees!.map(x => (x.id === m.id ? m : x)))} />)}
            </ul>)}
      </CarteAdmin>
    </>
  )
}
