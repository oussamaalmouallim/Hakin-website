import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Bouton, Champ, useNotifier } from '@/design-system'
import { CONSTRUIT_LE, VERSION_SITE } from '@/lib/supervision'
import { cn } from '@/lib/utils'
import {
  controlerMaintenant, controlesRecents, dernieresRepublications, etatSupervision, listerSauvegardes, noterSauvegarde, statistiquesSupervision, versionEnLigne,
  type Controle, type EtatSupervision, type Sauvegarde, type StatistiquesSupervision,
} from './api'
import { CarteAdmin, Chargement, EnTeteAdmin, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'
import { JournalTechnique } from './SupervisionJournal'
import {
  Chiffre, DEPOT, GROUPES_SERVICES, LienExterne, ROBOT_EN_RETARD_MIN, Statut, depuis, ms, pireStatut, pourcent, tableauSupabase,
} from './supervisionCommun'

/** Supervision technique (rôle « technique » seulement, vérifié par la base), en cinq onglets sur une seule page.
 *  Chaque chiffre vient d'une mesure réelle : contrôles du robot (GitHub Actions, toutes les 30 min) et de ce navigateur,
 *  erreurs envoyées par les visiteurs, pages vues, appels et blocages des limites, sauvegardes, déploiements vus.
 *  Sans contrôle récent, un service est « inconnu », jamais vert. Ce qui n'est pas mesurable d'ici est dit tel quel. */

const ONGLETS = [
  { id: 'vue', libelle: 'Vue d\'ensemble' },
  { id: 'sante', libelle: 'Santé' },
  { id: 'journal', libelle: 'Journaux' },
  { id: 'securite', libelle: 'Sécurité' },
  { id: 'maintenance', libelle: 'Maintenance' },
] as const
type Onglet = (typeof ONGLETS)[number]['id']

/** Pourquoi chaque limite a cette valeur (affiché à côté de la règle lue en base). */
const JUSTIFICATIONS: Record<string, string> = {
  commande: 'Un client passe rarement plus d\'une ou deux commandes en une heure. Le plafond global arrête un envoi en masse, même si l\'adresse change à chaque requête.',
  erreur_client: 'Une page qui plante en boucle ne doit pas remplir la base ni masquer les autres erreurs.',
  demande_whatsapp: 'Un visiteur ouvre quelques conversations, pas des dizaines en dix minutes.',
  visite: 'Une navigation normale fait quelques pages par minute ; au-delà, c\'est un robot.',
  controle_robot: 'Le robot écrit une fois toutes les 30 min ; la marge couvre les relances à la main et les scripts de sauvegarde.',
}

// ── Vue d'ensemble ────────────────────────────────────────────────────────────────────────────────

function Tendance({ points }: { points: EtatSupervision['tendance'] }) {
  if (points.length < 2) return <p className="text-[13px] text-gris">Pas encore assez de contrôles pour tracer une tendance (il en faut sur au moins deux heures).</p>
  const max = Math.max(1, ...points.map(p => Math.max(p.site_ms ?? 0, p.base_ms ?? 0)))
  const largeur = 100 / points.length
  const moyenne = (k: 'site_ms' | 'base_ms') => { const v = points.map(p => p[k]).filter((x): x is number => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null }
  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-28 w-full" role="img"
        aria-label={`Temps de réponse par heure sur ${points.length} heures : site ${ms(moyenne('site_ms'))} en moyenne, API ${ms(moyenne('base_ms'))}, ${points.reduce((a, p) => a + p.echecs, 0)} contrôle(s) en échec.`}>
        {points.map((p, i) => {
          const hs = ((p.site_ms ?? 0) / max) * 36
          const hb = ((p.base_ms ?? 0) / max) * 36
          return (
            <g key={p.heure}>
              <rect x={i * largeur + largeur * 0.1} y={40 - hs} width={largeur * 0.38} height={hs} className="fill-bronze" />
              <rect x={i * largeur + largeur * 0.52} y={40 - hb} width={largeur * 0.38} height={hb} className="fill-encre" />
              {p.echecs > 0 && <rect x={i * largeur} y={0} width={largeur} height={2.5} className="fill-danger" />}
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-gris">
        <span><span className="mr-1.5 inline-block h-2 w-3 bg-bronze align-middle" aria-hidden />Site, moyenne {ms(moyenne('site_ms'))}</span>
        <span><span className="mr-1.5 inline-block h-2 w-3 bg-encre align-middle" aria-hidden />API et base, moyenne {ms(moyenne('base_ms'))}</span>
        <span><span className="mr-1.5 inline-block h-1 w-3 bg-danger align-middle" aria-hidden />heure avec un échec</span>
        <span>Échelle : 0 à {max} ms · {formatDate(points[0].heure)} → maintenant</span>
      </figcaption>
    </figure>
  )
}

function VueEnsemble({ etat, stats }: { etat: EtatSupervision; stats: StatistiquesSupervision }) {
  const robotEnRetard = !etat.dernier_robot || (Date.now() - new Date(etat.dernier_robot).getTime()) / 60000 > ROBOT_EN_RETARD_MIN
  const global = pireStatut(etat.services)
  const accueil = etat.services.find(s => s.cible === 'site : accueil')
  const api = etat.services.find(s => s.cible === 'base : API et données')
  const deploiement = etat.deploiements[0]
  const sauvegarde = etat.sauvegardes.derniere
  const joursSauvegarde = sauvegarde ? Math.floor((Date.now() - new Date(sauvegarde).getTime()) / 86400000) : null
  const c = etat.compteurs_24h
  return (
    <div className="flex flex-col gap-6">
      <CarteAdmin titre="État du site" texte="Le pire état de chaque partie. Opérationnel : le dernier contrôle a réussi, dans les temps. Dégradé : lent, ou un échec dans les 6 dernières heures. Indisponible : le dernier contrôle a échoué. Inconnu : aucun contrôle depuis 75 minutes.">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Statut statut={global} />
          <span className="text-[13px] text-gris">
            {etat.dernier_robot ? <>Dernier passage du robot : {depuis(etat.dernier_robot)}{robotEnRetard && <strong className="text-danger"> — en retard</strong>}</> : 'Le robot n\'a encore rien envoyé : les états viennent seulement des contrôles lancés depuis l\'admin.'}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {GROUPES_SERVICES.map(g => {
            const lignes = etat.services.filter(s => g.filtre(s.cible))
            const dernier = lignes.map(s => s.dernier).sort().at(-1)
            return (
              <div key={g.cle} className="flex flex-col gap-2 rounded-carte bg-fond p-4">
                <span className="label">{g.titre}</span>
                <Statut statut={pireStatut(lignes)} />
                <span className="text-[12px] text-gris">{g.texte}</span>
                <span className="text-[12px] text-gris">{dernier ? `Contrôlé ${depuis(dernier)}` : 'Jamais contrôlé'}</span>
              </div>
            )
          })}
        </div>
      </CarteAdmin>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Chiffre valeur={pourcent(accueil?.disponibilite_24h)} libelle="Disponibilité du site, 24 h" aide={accueil ? `${accueil.controles_24h} contrôles` : 'aucun contrôle'} alerte={(accueil?.disponibilite_24h ?? 100) < 99} />
        <Chiffre valeur={ms(accueil?.moyenne_ms_24h)} libelle="Réponse du site, moyenne 24 h" alerte={(accueil?.moyenne_ms_24h ?? 0) > (accueil?.seuil_ms ?? Infinity)} />
        <Chiffre valeur={ms(api?.moyenne_ms_24h)} libelle="Réponse de l'API, moyenne 24 h" alerte={(api?.moyenne_ms_24h ?? 0) > (api?.seuil_ms ?? Infinity)} />
        <Chiffre valeur={c.erreurs} libelle="Erreurs du site, 24 h" aide={`dont ${c.erreurs_api} d'API`} alerte={c.erreurs > 0} />
        <Chiffre valeur={c.appels_publics} libelle="Écritures publiques, 24 h" aide="commandes, demandes, pages vues, erreurs" />
        <Chiffre valeur={c.appels_bloques} libelle="Requêtes bloquées, 24 h" alerte={c.appels_bloques > 0} />
        <Chiffre valeur={deploiement ? deploiement.version.slice(0, 7) : '—'} libelle="Dernier déploiement vu" aide={deploiement ? depuis(deploiement.vu_le) : 'aucun encore'} />
        <Chiffre valeur={joursSauvegarde === null ? 'Aucune' : `${joursSauvegarde} j`} libelle="Dernière sauvegarde" alerte={joursSauvegarde === null || joursSauvegarde > 7} aide={etat.sauvegardes.derniere_restauration ? `restauration testée ${depuis(etat.sauvegardes.derniere_restauration)}` : 'restauration jamais testée'} />
      </div>

      <CarteAdmin titre="Temps de réponse, 48 heures" texte="Moyenne par heure des contrôles réussis : site (pages) et API (base, comptes). Une barre rouge en haut marque une heure avec au moins un échec.">
        <Tendance points={etat.tendance} />
      </CarteAdmin>

      <CarteAdmin titre="Fréquentation" texte="Pages vues, sans cookie : un visiteur = une empreinte hachée de son adresse réseau, jamais gardée en clair. L'administration n'est pas comptée.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Chiffre valeur={stats.visites.aujourdhui} libelle="Pages vues aujourd'hui" />
          <Chiffre valeur={stats.visites.visiteurs_aujourdhui} libelle="Visiteurs aujourd'hui" />
          <Chiffre valeur={stats.visites.visiteurs_sept_jours} libelle="Visiteurs, 7 jours" />
          <Chiffre valeur={stats.visites.lcp_median_ms === null ? '—' : `${(stats.visites.lcp_median_ms / 1000).toFixed(1).replace('.', ',')} s`} libelle={`Affichage médian, 7 j (${stats.visites.lcp_mesures} mesures)`} alerte={(stats.visites.lcp_median_ms ?? 0) > 2500} />
        </div>
      </CarteAdmin>
    </div>
  )
}

// ── Santé ─────────────────────────────────────────────────────────────────────────────────────────

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

function Sante({ etat, recharger }: { etat: EtatSupervision; recharger: () => void }) {
  const notifier = useNotifier()
  const controles = useChargement(controlesRecents)
  const [direct, setDirect] = useState<Controle[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const lancer = async () => {
    setEnCours(true)
    try { setDirect(await controlerMaintenant()); recharger(); void controles.recharger() } catch (e) { notifier({ ton: 'erreur', message: String((e as Error)?.message ?? e) }) } finally { setEnCours(false) }
  }
  const incidents = (controles.donnees ?? []).filter(c => !c.ok).slice(0, 15)
  return (
    <div className="flex flex-col gap-6">
      <CarteAdmin titre="Services surveillés" texte="Un contrôle = une vraie requête, chronométrée, faite par le robot (GitHub Actions, toutes les 30 min) ou depuis ce navigateur. Disponibilité = part des contrôles réussis ; p95 = 95 % des réponses sont plus rapides que cette valeur."
        actions={<Bouton variante="contour" onClick={() => void lancer()} disabled={enCours}><RefreshCw className={cn('h-4 w-4', enCours && 'animate-spin')} aria-hidden />{enCours ? 'Contrôle…' : 'Contrôler maintenant'}</Bouton>}>
        {etat.services.length === 0 ? <p className="text-[13px] text-gris">Aucun contrôle enregistré : lancez « Contrôler maintenant », puis activez le robot (guide, chapitre « Surveillance »).</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead><tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris">
                <th className="py-2 pr-3 font-normal">Contrôle</th><th className="py-2 pr-3 font-normal">État</th><th className="py-2 pr-3 font-normal">Dernier</th>
                <th className="py-2 pr-3 font-normal">Dispo 24 h</th><th className="py-2 pr-3 font-normal">Dispo 7 j</th><th className="py-2 pr-3 font-normal">Moyenne</th><th className="py-2 pr-3 font-normal">p95</th><th className="py-2 font-normal">Seuil lent</th>
              </tr></thead>
              <tbody className="divide-y divide-ligne">
                {etat.services.map(s => (
                  <tr key={s.cible}>
                    <td className="py-2 pr-3">{s.cible}{s.detail && <span className="block text-[12px] text-gris">{s.detail}</span>}</td>
                    <td className="py-2 pr-3"><Statut statut={s.statut} /></td>
                    <td className="py-2 pr-3 text-gris">{depuis(s.dernier)} <span className="text-[11px]">({s.source})</span></td>
                    <td className="py-2 pr-3 tabular-nums">{pourcent(s.disponibilite_24h)} <span className="text-[11px] text-gris">/ {s.controles_24h}</span></td>
                    <td className="py-2 pr-3 tabular-nums">{pourcent(s.disponibilite_7j)}</td>
                    <td className="py-2 pr-3 tabular-nums">{ms(s.moyenne_ms_24h)}</td>
                    <td className="py-2 pr-3 tabular-nums">{ms(s.p95_ms_24h)}</td>
                    <td className="py-2 tabular-nums text-gris">{ms(s.seuil_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {direct && <><p className="label mb-2 mt-6 text-gris">Depuis ce navigateur, maintenant</p><TableControles lignes={direct} /></>}
      </CarteAdmin>

      <CarteAdmin titre="Incidents récents" texte="Contrôles en échec, 30 jours. Le détail complet, avec les lenteurs, est dans l'onglet Journaux.">
        {controles.erreur && <ErreurAdmin message={controles.erreur} onReessayer={controles.recharger} />}
        {incidents.length === 0 ? <p className="text-[13px] text-gris">Aucun contrôle en échec enregistré.</p> : (
          <ul className="divide-y divide-ligne text-[13px]">
            {incidents.map(c => <li key={c.id} className="flex flex-wrap gap-x-3 py-2"><span className="tabular-nums text-gris">{formatDate(c.cree_le!)}</span><span>{c.cible}</span><span className="text-danger">{c.detail || `HTTP ${c.statut_http}`}</span><span className="text-gris">({c.source})</span></li>)}
          </ul>
        )}
      </CarteAdmin>

      <CarteAdmin titre="Alertes" texte="Qui vous prévient, et quand.">
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-gris">
          <li><strong className="text-encre">Service externe</strong> (UptimeRobot ou Better Stack, à créer : guide, chapitre « Surveillance ») : interroge le site et <code>/rest/v1/rpc/sante</code> toutes les 1 à 5 min, e-mail dès qu'ils ne répondent plus.</li>
          <li><strong className="text-encre">Robot GitHub</strong>, toutes les 30 min : un échec, une lenteur trois fois de suite, des blocages ou erreurs en rafale, une clé admin bloquée → le workflow échoue et GitHub envoie un e-mail. Chaque jour à 9 h : rappel si aucune sauvegarde depuis 8 jours ou aucune restauration testée depuis 35 jours.</li>
          <li><strong className="text-encre">Supabase et Netlify</strong> envoient eux-mêmes un e-mail avant une mise en pause ou au dépassement d'un quota.</li>
        </ul>
      </CarteAdmin>
    </div>
  )
}

// ── Sécurité ──────────────────────────────────────────────────────────────────────────────────────

function Securite({ etat, stats }: { etat: EtatSupervision; stats: StatistiquesSupervision }) {
  return (
    <CarteAdmin titre="Limitation des requêtes et protections" texte="Limites appliquées par la base à chaque écriture publique. Au-delà, la base répond « 429 Trop de requêtes » avec le délai d'attente (Retry-After) et garde une trace du blocage. Le visiteur est reconnu par une empreinte de son adresse (falsifiable) : le plafond global tient même dans ce cas.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead><tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-gris"><th className="py-2 pr-3 font-normal">Action</th><th className="py-2 pr-3 font-normal">Par visiteur</th><th className="py-2 pr-3 font-normal">Tous visiteurs</th><th className="py-2 pr-3 font-normal">24 h : acceptées / bloquées</th><th className="py-2 font-normal">Pourquoi</th></tr></thead>
          <tbody className="divide-y divide-ligne">
            {stats.limites.regles.map(r => {
              const a = etat.appels_par_action_24h.find(x => x.action === r.action)
              return (
                <tr key={r.action} className="align-top">
                  <td className="py-2 pr-3">{r.description}<span className="block font-mono text-[11px] text-gris">{r.action}</span></td>
                  <td className="py-2 pr-3 tabular-nums">{r.maximum} / {r.fenetre_minutes} min</td>
                  <td className="py-2 pr-3 tabular-nums">{r.maximum_global ?? '—'}</td>
                  <td className="py-2 pr-3 tabular-nums">{a?.acceptes ?? 0} / <span className={cn(a?.bloques && 'text-danger')}>{a?.bloques ?? 0}</span></td>
                  <td className="py-2 text-[12px] text-gris">{JUSTIFICATIONS[r.action] ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="label mb-2 mt-6 text-gris">Activité anormale (7 jours, 5 blocages ou plus)</p>
      {stats.limites.suspects.length === 0 ? <p className="text-[13px] text-gris">Rien à signaler.</p>
        : <ul className="divide-y divide-ligne text-[13px]">{stats.limites.suspects.map(s => <li key={`${s.visiteur}-${s.action}`} className="flex flex-wrap gap-x-3 py-2"><span className="font-mono">{s.visiteur}…</span><span>{s.action}</span><span className="text-danger">{s.bloques} blocages</span><span className="text-gris">dernier {formatDate(s.dernier)}</span></li>)}</ul>}
      <p className="label mb-2 mt-6 text-gris">Derniers blocages</p>
      {stats.limites.historique.length === 0 ? <p className="text-[13px] text-gris">Aucun blocage enregistré.</p>
        : <ul className="divide-y divide-ligne text-[13px]">{stats.limites.historique.slice(0, 10).map((h, i) => <li key={i} className="flex flex-wrap gap-x-3 py-1.5"><span className="tabular-nums text-gris">{formatDate(h.cree_le)}</span><span>{h.action}</span><span className="font-mono text-gris">{h.visiteur}…</span></li>)}</ul>}
      <p className="label mb-2 mt-6 text-gris">Protections en place</p>
      <ul className="list-disc space-y-1 pl-5 text-[13px] text-gris">
        <li>Droits vérifiés par la base (RLS) : chaque client ne lit que ses données ; l'administration exige le compte, le mot de passe et la clé.</li>
        <li>Clé admin : 5 erreurs = 15 min de blocage, chaque erreur notée dans le journal ; session déverrouillée 12 h au plus.</li>
        <li>Commande : prix, pièce, coloris, taille et ville vérifiés par la base ; limite par visiteur et plafond global.</li>
        <li>Comptes (inscription, connexion, e-mails) : limites propres à Supabase Auth, réglables dans son tableau de bord.</li>
        <li>Hébergement : CSP stricte, protection contre l'intégration dans une autre page, HTTPS imposé.</li>
      </ul>
      <div className="mt-4"><LienExterne href={`${tableauSupabase}/auth/rate-limits`}>Limites de Supabase Auth</LienExterne></div>
    </CarteAdmin>
  )
}

// ── Maintenance ───────────────────────────────────────────────────────────────────────────────────

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
  const libelle = { manuelle: 'Sauvegarde', restauration_testee: 'Restauration testée', echec: 'Échec' } as const
  return (
    <CarteAdmin titre="Sauvegardes" texte={<>Sur l'offre gratuite de Supabase, aucune sauvegarde restaurable n'est faite pour vous. <code>npm run sauvegarde</code> copie la base sur votre ordinateur et la note ici ; <code>npm run sauvegarde:tester</code> la restaure dans une base jetable pour prouver qu'elle marche. Une sauvegarde n'est fiable qu'une fois sa restauration testée.</>}>
      {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
      <p className={cn('mb-4 text-[14px]', (jours === null || jours > 7) && 'text-danger')}>
        {jours === null ? 'Aucune sauvegarde notée.' : `Dernière sauvegarde : ${formatDate(derniere!.cree_le)} (${jours} jour${jours > 1 ? 's' : ''}).`}
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
          {liste.donnees!.map(s => <li key={s.id} className="flex flex-wrap gap-x-3 py-2"><span className="tabular-nums text-gris">{formatDate(s.cree_le)}</span><span className={cn(s.type === 'echec' && 'text-danger')}>{libelle[s.type]}</span><span className="text-gris">{s.note}</span></li>)}
        </ul>
      )}
    </CarteAdmin>
  )
}

function Maintenance({ etat }: { etat: EtatSupervision }) {
  const enLigne = useChargement(versionEnLigne)
  const republications = useChargement(dernieresRepublications)
  const v = enLigne.donnees
  const differente = v && v.version !== VERSION_SITE
  return (
    <div className="flex flex-col gap-6">
      <CarteAdmin titre="Version et déploiements" texte="La version de ce navigateur, celle publiée en ligne, et chaque nouvelle version vue par le robot ou par l'admin. Différentes : rechargez la page, ou un déploiement est en cours.">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
          <div><dt className="label text-gris">Ce navigateur</dt><dd className="mt-1 font-mono">{VERSION_SITE}{CONSTRUIT_LE && <span className="text-gris"> · construite le {formatDate(CONSTRUIT_LE)}</span>}</dd></div>
          <div><dt className="label text-gris">En ligne</dt><dd className="mt-1 font-mono">{enLigne.enCours ? '…' : v ? <>{v.version}<span className="text-gris"> · {formatDate(v.construit_le)}</span>{differente && <strong className="text-danger"> — différente</strong>}</> : 'version.json introuvable'}</dd></div>
        </dl>
        <p className="label mb-2 mt-5 text-gris">Déploiements vus</p>
        {etat.deploiements.length === 0 ? <p className="text-[13px] text-gris">Aucun encore : le robot les note à son passage, l'admin quand il lance un contrôle sur le site en ligne.</p>
          : <ul className="divide-y divide-ligne text-[13px]">{etat.deploiements.map(d => <li key={d.version} className="flex flex-wrap gap-x-3 py-1.5"><span className="font-mono">{d.version.slice(0, 12)}</span><span className="text-gris">construite {d.construit_le ? formatDate(d.construit_le) : '—'} · vue {formatDate(d.vu_le)}</span></li>)}</ul>}
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
      <Sauvegardes />
      <CarteAdmin titre="Ce qui se lit ailleurs" texte="Le nombre total de requêtes à l'API, les journaux internes (SQL, comptes, stockage) et l'usage des quotas ne se lisent pas depuis le site sans clé secrète. Ils restent dans les tableaux de bord des fournisseurs.">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <LienExterne href={`${tableauSupabase}/logs/explorer`}>Journaux Supabase</LienExterne>
          <LienExterne href={`${tableauSupabase}/reports`}>Rapports d'usage (requêtes API)</LienExterne>
          <LienExterne href={`${tableauSupabase}/database/backups/scheduled`}>Sauvegardes Supabase</LienExterne>
          <LienExterne href="https://app.netlify.com/teams">Usage Netlify (crédits)</LienExterne>
        </div>
      </CarteAdmin>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────────────────────────

export function Supervision() {
  const [params, setParams] = useSearchParams()
  const onglet: Onglet = ONGLETS.some(o => o.id === params.get('onglet')) ? params.get('onglet') as Onglet : 'vue'
  const choisir = (id: Onglet) => setParams(id === 'vue' ? {} : { onglet: id }, { replace: true })
  const donnees = useChargement(async () => {
    const [etat, stats] = await Promise.all([etatSupervision(), statistiquesSupervision()])
    return { etat, stats }
  })
  const d = donnees.donnees
  // Flèches gauche/droite entre les onglets (motif « tablist » de l'ARIA).
  const clavier = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = ONGLETS.findIndex(o => o.id === onglet)
    const suivant = ONGLETS[(i + (e.key === 'ArrowRight' ? 1 : ONGLETS.length - 1)) % ONGLETS.length].id
    choisir(suivant)
    document.getElementById(`onglet-${suivant}`)?.focus()
  }
  return (
    <>
      <EnTeteAdmin surtitre="Technique" titre="Supervision" texte="Santé du site et de l'API, journaux, sécurité, sauvegardes et déploiements. Réservé au rôle technique."
        actions={<Bouton variante="contour" onClick={donnees.recharger}><RefreshCw className="h-4 w-4" aria-hidden />Actualiser</Bouton>} />
      <div role="tablist" aria-label="Parties de la supervision" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-ligne px-1">
        {ONGLETS.map(o => (
          <button key={o.id} id={`onglet-${o.id}`} type="button" role="tab" aria-selected={onglet === o.id} aria-controls="panneau-supervision" tabIndex={onglet === o.id ? 0 : -1}
            onClick={() => choisir(o.id)} onKeyDown={clavier}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors', onglet === o.id ? 'border-encre text-encre' : 'border-transparent text-gris hover:text-encre')}>
            {o.libelle}
          </button>
        ))}
      </div>
      <div id="panneau-supervision" role="tabpanel" aria-labelledby={`onglet-${onglet}`}>
        {donnees.erreur && <ErreurAdmin message={donnees.erreur} onReessayer={donnees.recharger} />}
        {onglet === 'journal' ? <JournalTechnique /> : (
          <>
            {donnees.enCours && !d && <Chargement />}
            {d && onglet === 'vue' && <VueEnsemble etat={d.etat} stats={d.stats} />}
            {d && onglet === 'sante' && <Sante etat={d.etat} recharger={donnees.recharger} />}
            {d && onglet === 'securite' && <Securite etat={d.etat} stats={d.stats} />}
            {d && onglet === 'maintenance' && <Maintenance etat={d.etat} />}
          </>
        )}
      </div>
    </>
  )
}
