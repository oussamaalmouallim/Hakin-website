import { useState, type FormEvent, type ReactNode } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Bouton, Champ, useNotifier } from '@/design-system'
import { CONSTRUIT_LE, VERSION_SITE } from '@/lib/supervision'
import { cn } from '@/lib/utils'
import {
  controlerMaintenant, controlesRecents, dernieresRepublications, erreursRecentes, listerSauvegardes, noterSauvegarde, statistiquesSupervision, versionEnLigne,
  type Controle, type ErreurSite, type Sauvegarde,
} from './api'
import { CarteAdmin, Chargement, EnTeteAdmin, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'

/** Supervision technique (rôle « technique » seulement, vérifié par la base). Chaque chiffre vient d'une mesure réelle :
 *  contrôles du robot (GitHub Actions, toutes les 30 min) et de ce navigateur, erreurs envoyées par les visiteurs,
 *  pages vues, blocages des limites, sauvegardes notées. Ce qui n'est pas mesuré est dit tel quel. */

const DEPOT = 'https://github.com/oussamaalmouallim/Hakin-website'
const refProjet = (import.meta.env.VITE_SUPABASE_URL ?? '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
const tableauSupabase = refProjet ? `https://supabase.com/dashboard/project/${refProjet}` : 'https://supabase.com/dashboard/projects'
const ROBOT_EN_RETARD_MIN = 75 // le robot passe toutes les 30 min ; au-delà de 75 min sans nouvelles, on le dit

const depuis = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`
  return `il y a ${Math.round(min / 1440)} jours`
}
const ms = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v} ms`)

function Chiffre({ valeur, libelle, alerte }: { valeur: ReactNode; libelle: string; alerte?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-carte bg-fond p-4">
      <span className={cn('font-display text-[28px] leading-none tabular-nums', alerte && 'text-danger')}>{valeur}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris">{libelle}</span>
    </div>
  )
}

function LienExterne({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-encre underline underline-offset-4">{children}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
}

function TableControles({ lignes }: { lignes: Controle[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead><tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris"><th className="py-2 pr-3 font-normal">Contrôle</th><th className="py-2 pr-3 font-normal">État</th><th className="py-2 pr-3 font-normal">HTTP</th><th className="py-2 pr-3 font-normal">Temps</th><th className="py-2 font-normal">Détail</th></tr></thead>
        <tbody className="divide-y divide-ligne">
          {lignes.map((c, i) => (
            <tr key={`${c.cible}-${i}`}>
              <td className="py-2 pr-3">{c.cible}</td>
              <td className="py-2 pr-3"><Pastille ton={c.ok ? 'succes' : 'danger'}>{c.ok ? 'OK' : 'Échec'}</Pastille></td>
              <td className="py-2 pr-3 tabular-nums">{c.statut_http ?? '—'}</td>
              <td className="py-2 pr-3 tabular-nums">{ms(c.duree_ms)}</td>
              <td className="py-2 text-gris">{c.detail || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Dernier passage du robot : ses contrôles, regroupés par minute d'envoi. */
function dernierPassageRobot(controles: Controle[]) {
  const robot = controles.filter(c => c.source === 'robot')
  if (!robot.length) return null
  const minute = robot[0].cree_le!.slice(0, 16)
  return { quand: robot[0].cree_le!, lignes: robot.filter(c => c.cree_le!.slice(0, 16) === minute) }
}

function EtatGeneral({ controles, recharger }: { controles: Controle[]; recharger: () => void }) {
  const notifier = useNotifier()
  const [direct, setDirect] = useState<Controle[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const lancer = async () => {
    setEnCours(true)
    try { setDirect(await controlerMaintenant()); recharger() } catch (e) { notifier({ ton: 'erreur', message: String((e as Error)?.message ?? e) }) } finally { setEnCours(false) }
  }
  const robot = dernierPassageRobot(controles)
  const robotEnRetard = !robot || (Date.now() - new Date(robot.quand).getTime()) / 60000 > ROBOT_EN_RETARD_MIN
  const echecs = [...(direct ?? []), ...(robot?.lignes ?? [])].filter(c => !c.ok)
  const verdict = echecs.length ? { ton: 'danger' as const, texte: `${echecs.length} contrôle(s) en échec` }
    : !direct && robotEnRetard ? { ton: 'neutre' as const, texte: 'État inconnu : lancez un contrôle' }
    : { ton: 'succes' as const, texte: 'Tout répond' }
  const incidents = controles.filter(c => !c.ok).slice(0, 15)
  return (
    <CarteAdmin titre="État général" texte="Contrôles du site, de la base, des comptes et des photos. Le robot passe toutes les 30 minutes ; le bouton contrôle maintenant, depuis ce navigateur."
      actions={<Bouton variante="contour" onClick={() => void lancer()} disabled={enCours}><RefreshCw className={cn('h-4 w-4', enCours && 'animate-spin')} aria-hidden />{enCours ? 'Contrôle…' : 'Contrôler maintenant'}</Bouton>}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Pastille ton={verdict.ton}>{verdict.texte}</Pastille>
        <span className="text-[13px] text-gris">
          {robot ? <>Dernier passage du robot : {formatDate(robot.quand)} ({depuis(robot.quand)}){robotEnRetard && <strong className="text-danger"> — en retard</strong>}</>
            : <>Le robot n'a encore rien envoyé (workflow « Surveillance » à activer : voir GUIDE_HEBERGEMENT.md).</>}
        </span>
      </div>
      {direct && <><p className="label mb-2 text-gris">Depuis ce navigateur, maintenant</p><TableControles lignes={direct} /></>}
      {robot && <><p className="label mb-2 mt-6 text-gris">Dernier passage du robot</p><TableControles lignes={robot.lignes} /></>}
      <p className="label mb-2 mt-6 text-gris">Incidents récents (contrôles en échec, 30 jours)</p>
      {incidents.length === 0 ? <p className="text-[13px] text-gris">Aucun contrôle en échec enregistré.</p> : (
        <ul className="divide-y divide-ligne text-[13px]">
          {incidents.map(c => <li key={c.id} className="flex flex-wrap gap-x-3 py-2"><span className="tabular-nums text-gris">{formatDate(c.cree_le!)}</span><span>{c.cible}</span><span className="text-danger">{c.detail || `HTTP ${c.statut_http}`}</span><span className="text-gris">({c.source})</span></li>)}
        </ul>
      )}
    </CarteAdmin>
  )
}

function Version() {
  const enLigne = useChargement(versionEnLigne)
  const republications = useChargement(dernieresRepublications)
  const v = enLigne.donnees
  const differente = v && v.version !== VERSION_SITE
  return (
    <CarteAdmin titre="Version et déploiements" texte="La version de ce navigateur et celle publiée en ligne. Différentes : rechargez la page, ou un déploiement est en cours.">
      <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
        <div><dt className="label text-gris">Ce navigateur</dt><dd className="mt-1 font-mono">{VERSION_SITE}{CONSTRUIT_LE && <span className="text-gris"> · construite le {formatDate(CONSTRUIT_LE)}</span>}</dd></div>
        <div><dt className="label text-gris">En ligne</dt><dd className="mt-1 font-mono">{enLigne.enCours ? '…' : v ? <>{v.version}<span className="text-gris"> · {formatDate(v.construit_le)}</span>{differente && <strong className="text-danger"> — différente</strong>}</> : 'version.json introuvable'}</dd></div>
      </dl>
      <p className="label mb-2 mt-5 text-gris">Aperçus de partage republiés par le robot</p>
      {(republications.donnees?.length ?? 0) === 0
        ? <p className="text-[13px] text-gris">Aucune republication automatique (build hook Netlify non fourni au robot, ou catalogue inchangé).</p>
        : <ul className="divide-y divide-ligne text-[13px]">{republications.donnees!.map(r => <li key={r.cree_le} className="py-1.5"><span className="tabular-nums text-gris">{formatDate(r.cree_le)}</span> · {r.raison}</li>)}</ul>}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        <LienExterne href={`${DEPOT}/actions`}>CI et robot (GitHub Actions)</LienExterne>
        <LienExterne href={`${DEPOT}/commits/main`}>Historique des modifications</LienExterne>
        <LienExterne href="https://app.netlify.com/">Déploiements (Netlify)</LienExterne>
      </div>
    </CarteAdmin>
  )
}

function Erreurs({ erreurs }: { erreurs: ErreurSite[] }) {
  const [filtre, setFiltre] = useState<'tout' | 'erreur' | 'avertissement'>('tout')
  const liste = erreurs.filter(e => filtre === 'tout' || e.gravite === filtre)
  return (
    <CarteAdmin titre="Erreurs du site" texte="Envoyées par les navigateurs des visiteurs : script, promesse, affichage, appel à la base, fichier introuvable. E-mails, numéros et jetons sont retirés avant l'envoi et encore en base. Conservées 30 jours."
      actions={<div className="flex gap-2" role="group" aria-label="Gravité">{(['tout', 'erreur', 'avertissement'] as const).map(f => <button key={f} type="button" aria-pressed={filtre === f} onClick={() => setFiltre(f)} className={cn('rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]', filtre === f ? 'bg-encre text-fond' : 'border border-ligne-forte text-gris')}>{f}</button>)}</div>}>
      {liste.length === 0 ? <p className="text-[13px] text-gris">Aucune erreur enregistrée{filtre !== 'tout' ? ' de ce niveau' : ''}.</p> : (
        <ul className="divide-y divide-ligne">
          {liste.map(e => (
            <li key={e.id} className="py-3">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <Pastille ton={e.gravite === 'erreur' ? 'danger' : 'neutre'}>{e.gravite}</Pastille>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-gris">{e.type}</span>
                  <span className="min-w-0 flex-1 break-words">{e.message}</span>
                  <span className="tabular-nums text-gris">{formatDate(e.cree_le)}</span>
                </summary>
                <dl className="mt-2 grid gap-1 pl-1 text-[12px] text-gris sm:grid-cols-2">
                  <div>Page : <span className="text-encre">{e.page || '—'}</span></div>
                  <div>Source : <span className="break-all text-encre">{e.source || '—'}</span></div>
                  <div>Version : <span className="font-mono text-encre">{e.version || '—'}</span></div>
                  <div>Navigateur : <span className="text-encre">{e.navigateur || '—'}</span></div>
                </dl>
              </details>
            </li>
          ))}
        </ul>
      )}
    </CarteAdmin>
  )
}

function Sauvegardes() {
  const notifier = useNotifier()
  const liste = useChargement(listerSauvegardes)
  const [note, setNote] = useState('')
  const [type, setType] = useState<Sauvegarde['type']>('manuelle')
  const [envoi, setEnvoi] = useState(false)
  const derniere = liste.donnees?.find(s => s.type === 'manuelle')
  const jours = derniere ? Math.floor((Date.now() - new Date(derniere.cree_le).getTime()) / 86400000) : null
  const noter = async (e: FormEvent) => {
    e.preventDefault(); setEnvoi(true)
    try { await noterSauvegarde(type, note); setNote(''); liste.recharger(); notifier({ ton: 'succes', message: 'Noté.' }) }
    catch (er) { notifier({ ton: 'erreur', message: String((er as Error)?.message ?? er) }) } finally { setEnvoi(false) }
  }
  return (
    <CarteAdmin titre="Sauvegardes" texte={<>Aucune sauvegarde automatique n'est configurée sur ce projet. Faites-en une à la main (méthode dans <code>GUIDE_HEBERGEMENT.md</code>), puis notez-la ici.</>}>
      {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
      <p className={cn('mb-4 text-[14px]', (jours === null || jours > 7) && 'text-danger')}>
        {jours === null ? 'Aucune sauvegarde notée.' : `Dernière sauvegarde notée : ${formatDate(derniere!.cree_le)} (${jours} jour${jours > 1 ? 's' : ''}).`}
        {jours !== null && jours > 7 && ' Plus d\'une semaine : à refaire.'}
      </p>
      <form onSubmit={e => void noter(e)} className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-col gap-1 text-[13px]"><span className="label text-gris">Type</span>
          <select value={type} onChange={e => setType(e.target.value as Sauvegarde['type'])} className="rounded-[10px] border border-ligne-forte bg-blanc px-3 py-2.5">
            <option value="manuelle">Sauvegarde faite</option><option value="restauration_testee">Restauration testée</option>
          </select>
        </label>
        <div className="flex-1"><Champ label="Note (facultatif)" maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="Fichier rangé sur le disque externe" /></div>
        <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Noter'}</Bouton>
      </form>
      {(liste.donnees?.length ?? 0) > 0 && (
        <ul className="mt-5 divide-y divide-ligne text-[13px]">
          {liste.donnees!.map(s => <li key={s.id} className="flex flex-wrap gap-x-3 py-2"><span className="tabular-nums text-gris">{formatDate(s.cree_le)}</span><span>{s.type === 'manuelle' ? 'Sauvegarde' : 'Restauration testée'}</span><span className="text-gris">{s.note}</span></li>)}
        </ul>
      )}
    </CarteAdmin>
  )
}

export function Supervision() {
  const donnees = useChargement(async () => {
    const [stats, controles, erreurs] = await Promise.all([statistiquesSupervision(), controlesRecents(), erreursRecentes()])
    return { stats, controles, erreurs }
  })
  const d = donnees.donnees
  return (
    <>
      <EnTeteAdmin surtitre="Technique" titre="Supervision" texte="Santé du site, erreurs, fréquentation, limites et sauvegardes. Réservé au rôle technique."
        actions={<Bouton variante="contour" onClick={donnees.recharger}><RefreshCw className="h-4 w-4" aria-hidden />Actualiser</Bouton>} />
      {donnees.erreur && <ErreurAdmin message={donnees.erreur} onReessayer={donnees.recharger} />}
      {donnees.enCours && !d && <Chargement />}
      {d && (
        <div className="flex flex-col gap-6">
          <EtatGeneral controles={d.controles} recharger={donnees.recharger} />
          <Version />

          <CarteAdmin titre="Fréquentation" texte="Pages vues, sans cookie : un visiteur = une empreinte hachée de son adresse réseau, jamais gardée en clair. L'administration n'est pas comptée. Conservé 30 jours.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Chiffre valeur={d.stats.visites.aujourdhui} libelle="Pages vues aujourd'hui" />
              <Chiffre valeur={d.stats.visites.visiteurs_aujourdhui} libelle="Visiteurs aujourd'hui" />
              <Chiffre valeur={d.stats.visites.visiteurs_sept_jours} libelle="Visiteurs, 7 jours" />
              <Chiffre valeur={d.stats.visites.lcp_median_ms === null ? '—' : `${(d.stats.visites.lcp_median_ms / 1000).toFixed(1)} s`} libelle={`Affichage médian, 7 j (${d.stats.visites.lcp_mesures} mesures)`} alerte={(d.stats.visites.lcp_median_ms ?? 0) > 2500} />
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="label mb-2 text-gris">Pages les plus vues (7 jours)</p>
                {d.stats.visites.pages.length === 0 ? <p className="text-[13px] text-gris">Aucune page vue enregistrée.</p>
                  : <ul className="divide-y divide-ligne text-[13px]">{d.stats.visites.pages.map(p => <li key={p.page} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 truncate">{p.page}</span><span className="tabular-nums text-gris">{p.vues}</span></li>)}</ul>}
              </div>
              <div>
                <p className="label mb-2 text-gris">Par jour (14 jours)</p>
                {d.stats.visites.par_jour.length === 0 ? <p className="text-[13px] text-gris">Rien encore.</p>
                  : <ul className="divide-y divide-ligne text-[13px]">{d.stats.visites.par_jour.map(j => <li key={j.jour} className="flex justify-between gap-3 py-1.5"><span>{new Date(j.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span><span className="tabular-nums text-gris">{j.vues} vues · {j.visiteurs} visiteurs</span></li>)}</ul>}
              </div>
            </div>
            <p className="mt-4 text-[12px] text-gris">L'affichage médian (LCP) est mesuré sur la première page de chaque visite. Au-delà de 2,5 s, il est en rouge (seuil de Google).</p>
          </CarteAdmin>

          <div className="grid gap-3 md:grid-cols-3">
            <Chiffre valeur={d.stats.erreurs.vingt_quatre_heures} libelle="Erreurs, 24 h" alerte={d.stats.erreurs.vingt_quatre_heures > 0} />
            <Chiffre valeur={d.stats.erreurs.sept_jours} libelle="Erreurs, 7 jours" />
            <Chiffre valeur={d.stats.limites.bloques_7j} libelle="Requêtes bloquées, 7 jours" alerte={d.stats.limites.bloques_7j > 0} />
          </div>
          <Erreurs erreurs={d.erreurs} />

          <CarteAdmin titre="Limitation des requêtes et sécurité" texte="Limites appliquées par la base aux actions publiques. Le visiteur est reconnu par une empreinte de son adresse (falsifiable) : le plafond global tient même dans ce cas.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead><tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris"><th className="py-2 pr-3 font-normal">Action</th><th className="py-2 pr-3 font-normal">Par visiteur</th><th className="py-2 pr-3 font-normal">Tous visiteurs</th><th className="py-2 font-normal">Bloquées 24 h</th></tr></thead>
                <tbody className="divide-y divide-ligne">
                  {d.stats.limites.regles.map(r => {
                    const b = d.stats.limites.bloques_24h.find(x => x.action === r.action)
                    return <tr key={r.action}><td className="py-2 pr-3">{r.description}<span className="block font-mono text-[11px] text-gris">{r.action}</span></td><td className="py-2 pr-3 tabular-nums">{r.maximum} / {r.fenetre_minutes} min</td><td className="py-2 pr-3 tabular-nums">{r.maximum_global ?? '—'}</td><td className={cn('py-2 tabular-nums', b && 'text-danger')}>{b ? `${b.bloques} (${b.visiteurs} visiteur${b.visiteurs > 1 ? 's' : ''})` : 0}</td></tr>
                  })}
                </tbody>
              </table>
            </div>
            <p className="label mb-2 mt-6 text-gris">Activité anormale (7 jours, 5 blocages ou plus)</p>
            {d.stats.limites.suspects.length === 0 ? <p className="text-[13px] text-gris">Rien à signaler.</p>
              : <ul className="divide-y divide-ligne text-[13px]">{d.stats.limites.suspects.map(s => <li key={`${s.visiteur}-${s.action}`} className="flex flex-wrap gap-x-3 py-2"><span className="font-mono">{s.visiteur}…</span><span>{s.action}</span><span className="text-danger">{s.bloques} blocages</span><span className="text-gris">dernier {formatDate(s.dernier)}</span></li>)}</ul>}
            <p className="label mb-2 mt-6 text-gris">Derniers blocages</p>
            {d.stats.limites.historique.length === 0 ? <p className="text-[13px] text-gris">Aucun blocage enregistré.</p>
              : <ul className="divide-y divide-ligne text-[13px]">{d.stats.limites.historique.slice(0, 10).map((h, i) => <li key={i} className="flex flex-wrap gap-x-3 py-1.5"><span className="tabular-nums text-gris">{formatDate(h.cree_le)}</span><span>{h.action}</span><span className="font-mono text-gris">{h.visiteur}…</span></li>)}</ul>}
            <p className="label mb-2 mt-6 text-gris">Protections en place</p>
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-gris">
              <li>Droits vérifiés par la base (RLS) : chaque client ne lit que ses données ; l'administration exige le compte, le mot de passe et la clé.</li>
              <li>Clé admin : 5 erreurs = 15 min de blocage ; session déverrouillée 12 h au plus.</li>
              <li>Commande : prix, pièce, coloris, taille et ville vérifiés par la base ; limite par visiteur et plafond global.</li>
              <li>Hébergement : CSP stricte, protection contre l'intégration dans une autre page, HTTPS imposé (Netlify).</li>
            </ul>
          </CarteAdmin>

          <Sauvegardes />

          <CarteAdmin titre="Journaux de Supabase" texte="Les journaux internes (requêtes SQL, comptes, stockage) ne se lisent pas depuis le site sans clé secrète : ils restent dans le tableau de bord Supabase.">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <LienExterne href={`${tableauSupabase}/logs/explorer`}>Journaux</LienExterne>
              <LienExterne href={`${tableauSupabase}/reports`}>Rapports d'usage</LienExterne>
              <LienExterne href={`${tableauSupabase}/database/backups/scheduled`}>Sauvegardes Supabase</LienExterne>
            </div>
          </CarteAdmin>
        </div>
      )}
    </>
  )
}
