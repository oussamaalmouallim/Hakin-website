import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock, DatabaseBackup, Gauge, GitCommitHorizontal, HardDrive, Radar, RefreshCw, Rocket, ServerCrash,
  ShieldAlert, ShieldCheck, Timer, Users, XCircle, type LucideIcon,
} from 'lucide-react'
import { Bouton, Champ, Selection, useNotifier } from '@/design-system'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { Progress } from '@/components/lightswind/progress'
import { CONSTRUIT_LE, VERSION_SITE } from '@/lib/supervision'
import { cn } from '@/lib/utils'
import {
  controlerMaintenant, controlesRecents, dernieresRepublications, journalTechnique, listerSauvegardes, noterSauvegarde, versionEnLigne,
  type Controle, type EtatSupervision, type Sauvegarde, type ServiceSurveille, type StatistiquesSupervision,
} from './api'
import { CarteAdmin, EtatVide, GrilleKpi, KpiCarte, Pastille, formatDate, useChargement } from './commun'
import { GraphiqueActivite, GraphiqueLimites, GraphiquePerformance } from './SupervisionGraphiques'
import {
  CorpsSupervision, DEPOT, EnTeteSupervision, GROUPES_SERVICES, LienExterne, ROBOT_EN_RETARD_MIN, Statut, TitreSection, depuis, joursDepuis, ms, pireStatut,
  pourcent, tableauSupabase, useSupervision,
} from './supervisionCommun'

/** Supervision technique (rôle « technique » seulement, vérifié par la base), en pages indépendantes.
 *  Chaque chiffre vient d'une mesure réelle : contrôles du robot (GitHub Actions, toutes les 30 min) et de ce navigateur,
 *  erreurs envoyées par les visiteurs, pages vues, appels et blocages des limites, sauvegardes, déploiements vus.
 *  Sans contrôle récent, un service est « inconnu », jamais vert. Ce qui n'est pas mesurable d'ici est dit tel quel.
 *  La page Journaux et incidents est dans SupervisionJournal.tsx. */

/** Écritures publiques limitées par `passer_limite` : action → fonction appelée (endpoint REST `/rest/v1/rpc/<nom>`). */
export const ENDPOINTS: Record<string, { libelle: string; fonctions: string[] }> = {
  commande: { libelle: 'Commandes', fonctions: ['passer_commande'] },
  demande_whatsapp: { libelle: 'Demandes WhatsApp', fonctions: ['noter_demande_whatsapp'] },
  visite: { libelle: 'Pages vues', fonctions: ['compter_visite'] },
  erreur_client: { libelle: 'Erreurs du site', fonctions: ['signaler_erreur'] },
  controle_robot: { libelle: 'Robot et scripts', fonctions: ['enregistrer_controles', 'noter_sauvegarde_script'] },
}
const LIBELLES_ACTIONS = Object.fromEntries(Object.entries(ENDPOINTS).map(([k, v]) => [k, v.libelle]))

/** Pourquoi chaque limite a cette valeur (affiché à côté de la règle lue en base). */
const JUSTIFICATIONS: Record<string, string> = {
  commande: 'Un client passe rarement plus d\'une ou deux commandes en une heure. Le plafond global arrête un envoi en masse, même si l\'adresse change à chaque requête.',
  erreur_client: 'Une page qui plante en boucle ne doit pas remplir la base ni masquer les autres erreurs.',
  demande_whatsapp: 'Un visiteur ouvre quelques conversations, pas des dizaines en dix minutes.',
  visite: 'Une navigation normale fait quelques pages par minute ; au-delà, c\'est un robot.',
  controle_robot: 'Le robot écrit une fois toutes les 30 min ; la marge couvre les relances à la main et les scripts de sauvegarde.',
}

const robotEnRetard = (etat: EtatSupervision) => !etat.dernier_robot || (Date.now() - new Date(etat.dernier_robot).getTime()) / 60000 > ROBOT_EN_RETARD_MIN
const tonDispo = (v: number | null | undefined) => (v === null || v === undefined ? 'encre' : v >= 99.5 ? 'succes' : v >= 97 ? 'alerte' : 'danger')

// ── Vue d'ensemble ────────────────────────────────────────────────────────────────────────────────

function EtatGlobal({ etat }: { etat: EtatSupervision }) {
  const global = pireStatut(etat.services)
  const retard = robotEnRetard(etat)
  return (
    <CarteAdmin titre="État du site" texte="Le pire état de chaque partie. Opérationnel : le dernier contrôle a réussi, dans les temps. Dégradé : lent, ou un échec dans les 6 dernières heures. Indisponible : le dernier contrôle a échoué. Inconnu : aucun contrôle depuis 75 minutes."
      actions={<Statut statut={global} taille="md" />}>
      <p className="mb-4 flex items-center gap-2 text-[13px] text-gris">
        <Radar className="h-4 w-4 shrink-0" aria-hidden />
        {etat.dernier_robot ? <span>Dernier passage du robot : {depuis(etat.dernier_robot)}{retard && <strong className="text-danger"> — en retard</strong>}</span> : 'Le robot n\'a encore rien envoyé : les états viennent seulement des contrôles lancés depuis l\'admin.'}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {GROUPES_SERVICES.map(g => {
          const lignes = etat.services.filter(s => g.filtre(s.cible))
          const dernier = lignes.map(s => s.dernier).sort().at(-1)
          const statut = pireStatut(lignes)
          return (
            <li key={g.cle} className={cn('flex flex-col gap-2 rounded-bloc border bg-fond p-3.5',
              statut === 'indisponible' ? 'border-danger/30' : statut === 'degrade' ? 'border-alerte/40' : 'border-ligne')}>
              <span className="text-[13px] font-semibold">{g.titre}</span>
              <Statut statut={statut} />
              <span className="text-[12px] leading-snug text-gris">{g.texte}</span>
              <span className="mt-auto text-[11.5px] text-gris">{dernier ? `Contrôlé ${depuis(dernier)}` : 'Jamais contrôlé'}</span>
            </li>
          )
        })}
      </ul>
    </CarteAdmin>
  )
}

function DerniersIncidents() {
  const j = useChargement(() => journalTechnique(168, null, null))
  const graves = (j.donnees ?? []).filter(e => e.gravite === 'critique' || e.gravite === 'erreur').slice(0, 6)
  return (
    <CarteAdmin titre="Derniers incidents" texte="Erreurs et événements critiques des 7 derniers jours."
      actions={<Link to="/admin/supervision/journaux" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-admin-info hover:underline">Tous les journaux<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}>
      {j.enCours && !j.donnees ? <p className="text-[13px] text-gris">Lecture…</p>
        : graves.length === 0 ? <EtatVide Icone={CheckCircle2} titre="Aucun incident" texte="Pas d'erreur ni d'événement critique sur 7 jours." />
        : (
          <ol className="relative flex flex-col gap-3 border-l border-ligne pl-4">
            {graves.map((e, i) => (
              <li key={`${e.quand}-${i}`} className="relative">
                <span className={cn('absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-fond-2', e.gravite === 'critique' ? 'bg-encre' : 'bg-danger')} aria-hidden />
                <p className="text-[13px] font-medium leading-snug">{e.message}</p>
                <p className="text-[12px] text-gris">{formatDate(e.quand)} · {e.origine}</p>
              </li>
            ))}
          </ol>
        )}
    </CarteAdmin>
  )
}

function VueEnsemble({ etat, stats }: { etat: EtatSupervision; stats: StatistiquesSupervision }) {
  const accueil = etat.services.find(s => s.cible === 'site : accueil')
  const api = etat.services.find(s => s.cible === 'base : API et données')
  const deploiement = etat.deploiements[0]
  const jSauvegarde = joursDepuis(etat.sauvegardes.derniere)
  const c = etat.compteurs_24h
  const bloquesTotal = etat.appels_par_action_24h.reduce((a, x) => a + x.bloques, 0)
  return (
    <div className="flex flex-col gap-5">
      <EtatGlobal etat={etat} />
      <GrilleKpi>
        <KpiCarte Icone={Activity} libelle="Disponibilité du site, 24 h" valeur={accueil?.disponibilite_24h ?? null} unite="%" ton={(accueil?.disponibilite_24h ?? 100) < 99 ? 'danger' : 'normal'}
          part={accueil?.disponibilite_24h !== null && accueil?.disponibilite_24h !== undefined ? { valeur: accueil.disponibilite_24h, ton: tonDispo(accueil.disponibilite_24h) } : undefined}
          aide={accueil ? `${accueil.controles_24h} contrôles` : 'aucun contrôle'} />
        <KpiCarte Icone={Timer} libelle="Réponse du site, moyenne 24 h" valeur={accueil?.moyenne_ms_24h ?? null} unite="ms" ton={(accueil?.moyenne_ms_24h ?? 0) > (accueil?.seuil_ms ?? Infinity) ? 'alerte' : 'normal'} aide={accueil ? `seuil lent : ${ms(accueil.seuil_ms)}` : undefined} />
        <KpiCarte Icone={Gauge} libelle="Réponse de l'API, moyenne 24 h" valeur={api?.moyenne_ms_24h ?? null} unite="ms" ton={(api?.moyenne_ms_24h ?? 0) > (api?.seuil_ms ?? Infinity) ? 'alerte' : 'normal'} aide={api ? `p95 : ${ms(api.p95_ms_24h)}` : undefined} />
        <KpiCarte Icone={Users} libelle="Écritures publiques à l'API, 24 h" valeur={c.appels_publics} aide="commandes, demandes, pages vues, erreurs" vers="/admin/supervision/securite" />
        <KpiCarte Icone={ServerCrash} libelle="Erreurs du site, 24 h" valeur={c.erreurs} ton={c.erreurs > 0 ? 'danger' : 'normal'} aide={`dont ${c.erreurs_api} d'API`} vers="/admin/supervision/journaux" />
        <KpiCarte Icone={ShieldAlert} libelle="Requêtes bloquées (429), 24 h" valeur={bloquesTotal} ton={bloquesTotal > 0 ? 'alerte' : 'normal'} vers="/admin/supervision/securite" />
        <KpiCarte Icone={DatabaseBackup} libelle="Dernière sauvegarde" valeur={jSauvegarde === null ? 'Aucune' : jSauvegarde} unite={jSauvegarde === null ? undefined : jSauvegarde > 1 ? 'jours' : 'jour'}
          ton={jSauvegarde === null || jSauvegarde > 7 ? 'danger' : 'normal'} vers="/admin/supervision/maintenance"
          aide={etat.sauvegardes.derniere_restauration ? `restauration testée ${depuis(etat.sauvegardes.derniere_restauration)}` : 'restauration jamais testée'} />
        <KpiCarte Icone={Rocket} libelle="Dernier déploiement vu" valeur={deploiement ? deploiement.version.slice(0, 7) : null} aide={deploiement ? depuis(deploiement.vu_le) : 'aucun encore'} vers="/admin/supervision/maintenance" />
      </GrilleKpi>
      <div className="grid gap-5 xl:grid-cols-2">
        <CarteAdmin titre="Performance, 48 heures" texte="Temps de réponse moyen par heure des contrôles réussis : site (pages) et API (base, comptes).">
          <GraphiquePerformance points={etat.tendance} />
        </CarteAdmin>
        <CarteAdmin titre="Activité, 30 jours" texte="Pages vues et visiteurs par jour, sans cookie : un visiteur = une empreinte hachée de son adresse, jamais gardée en clair.">
          <GraphiqueActivite jours={stats.visites.par_jour} />
        </CarteAdmin>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <CarteAdmin titre="Limitation des requêtes, 24 h" texte="Appels acceptés et bloqués par action publique."
          actions={<Link to="/admin/supervision/securite" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-admin-info hover:underline">Sécurité et API<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}>
          <GraphiqueLimites actions={etat.appels_par_action_24h} libelles={LIBELLES_ACTIONS} />
        </CarteAdmin>
        <DerniersIncidents />
      </div>
      <CarteAdmin titre="Fréquentation" texte="L'administration n'est pas comptée.">
        <GrilleKpi>
          <KpiCarte libelle="Pages vues aujourd'hui" valeur={stats.visites.aujourdhui} />
          <KpiCarte libelle="Visiteurs aujourd'hui" valeur={stats.visites.visiteurs_aujourdhui} />
          <KpiCarte libelle="Visiteurs, 7 jours" valeur={stats.visites.visiteurs_sept_jours} />
          <KpiCarte libelle={`Affichage médian, 7 j (${stats.visites.lcp_mesures} mesures)`} valeur={stats.visites.lcp_median_ms === null ? null : (stats.visites.lcp_median_ms / 1000).toFixed(1).replace('.', ',')} unite="s"
            ton={(stats.visites.lcp_median_ms ?? 0) > 2500 ? 'alerte' : 'normal'} />
        </GrilleKpi>
      </CarteAdmin>
    </div>
  )
}

export function SupervisionVue() {
  const d = useSupervision()
  return (
    <>
      <EnTeteSupervision titre="Vue d'ensemble" texte="Disponibilité, performance, erreurs, limitation des requêtes, sauvegardes et déploiements, en un coup d'œil."
        enCours={d.enCours} onActualiser={d.recharger} lu={d.donnees?.lu} />
      <CorpsSupervision d={d} kpi={4}>{x => <VueEnsemble etat={x.etat} stats={x.stats} />}</CorpsSupervision>
    </>
  )
}

// ── Santé et disponibilité ───────────────────────────────────────────────────────────────────────

function TableServices({ services }: { services: ServiceSurveille[] }) {
  return (
    <Table minWidth={820}>
      <TableHeader><TableRow className="hover:bg-transparent">
        <TableHead>Contrôle</TableHead><TableHead>État</TableHead><TableHead>Dernier</TableHead><TableHead className="w-44">Disponibilité 24 h</TableHead>
        <TableHead>7 jours</TableHead><TableHead>Moyenne</TableHead><TableHead>p95</TableHead><TableHead>Seuil lent</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {services.map(s => (
          <TableRow key={s.cible}>
            <TableCell className="font-medium">{s.cible}{s.detail && <span className="block text-[12px] font-normal text-gris">{s.detail}</span>}</TableCell>
            <TableCell><Statut statut={s.statut} /></TableCell>
            <TableCell className="whitespace-nowrap text-gris">{depuis(s.dernier)} <span className="text-[11px]">({s.source})</span></TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <span className="w-14 shrink-0 tabular-nums">{pourcent(s.disponibilite_24h)}</span>
                {s.disponibilite_24h !== null && <Progress className="w-20" valeur={s.disponibilite_24h} ton={tonDispo(s.disponibilite_24h)} libelle={`Disponibilité 24 h : ${s.cible}`} />}
              </div>
              <span className="text-[11px] text-gris">{s.controles_24h} contrôles</span>
            </TableCell>
            <TableCell className="tabular-nums">{pourcent(s.disponibilite_7j)}</TableCell>
            <TableCell className={cn('tabular-nums', (s.moyenne_ms_24h ?? 0) > s.seuil_ms && 'text-bronze-fonce')}>{ms(s.moyenne_ms_24h)}</TableCell>
            <TableCell className="tabular-nums">{ms(s.p95_ms_24h)}</TableCell>
            <TableCell className="tabular-nums text-gris">{ms(s.seuil_ms)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TableControles({ lignes, avecDate }: { lignes: Controle[]; avecDate?: boolean }) {
  return (
    <Table minWidth={620}>
      <TableHeader><TableRow className="hover:bg-transparent">
        {avecDate && <TableHead>Quand</TableHead>}<TableHead>Contrôle</TableHead><TableHead>Résultat</TableHead><TableHead>HTTP</TableHead><TableHead>Temps</TableHead><TableHead>Détail</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {lignes.map((c, i) => (
          <TableRow key={c.id ?? `${c.cible}-${i}`}>
            {avecDate && <TableCell className="whitespace-nowrap tabular-nums text-gris">{c.cree_le ? formatDate(c.cree_le) : '—'}</TableCell>}
            <TableCell>{c.cible}{c.source && <span className="ml-1.5 text-[11px] text-gris">({c.source})</span>}</TableCell>
            <TableCell><Pastille ton={c.ok ? 'succes' : 'danger'} point>{c.ok ? 'OK' : 'Échec'}</Pastille></TableCell>
            <TableCell className="tabular-nums">{c.statut_http ?? '—'}</TableCell>
            <TableCell className="tabular-nums">{ms(c.duree_ms)}</TableCell>
            <TableCell className="text-gris">{c.detail || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const PAGE_HISTORIQUE = 25

function Sante({ etat, direct }: { etat: EtatSupervision; direct: Controle[] | null }) {
  const controles = useChargement(controlesRecents)
  const [filtre, setFiltre] = useState<'tous' | 'echecs'>('tous')
  const [n, setN] = useState(PAGE_HISTORIQUE)
  const tous = controles.donnees ?? []
  const echecs = tous.filter(c => !c.ok)
  const visibles = (filtre === 'echecs' ? echecs : tous).slice(0, n)
  const ok = etat.services.filter(s => s.statut === 'operationnel').length
  const site = etat.services.find(s => s.cible === 'site : accueil')
  const api = etat.services.find(s => s.cible === 'base : API et données')
  return (
    <div className="flex flex-col gap-5">
      <GrilleKpi>
        <KpiCarte Icone={CheckCircle2} libelle="Contrôles opérationnels" valeur={etat.services.length ? `${ok} / ${etat.services.length}` : null} ton={etat.services.length && ok < etat.services.length ? 'alerte' : 'normal'}
          part={etat.services.length ? { valeur: ok, max: etat.services.length, ton: ok === etat.services.length ? 'succes' : 'alerte' } : undefined} />
        <KpiCarte Icone={Activity} libelle="Disponibilité du site, 7 jours" valeur={site?.disponibilite_7j ?? null} unite="%" aide={site ? `${site.controles_7j} contrôles` : 'aucun contrôle'} />
        <KpiCarte Icone={Gauge} libelle="API, p95 sur 24 h" valeur={api?.p95_ms_24h ?? null} unite="ms" aide={api ? `seuil lent : ${ms(api.seuil_ms)}` : undefined} />
        <KpiCarte Icone={XCircle} libelle="Contrôles en échec, 24 h" valeur={etat.compteurs_24h.controles_en_echec} ton={etat.compteurs_24h.controles_en_echec > 0 ? 'danger' : 'normal'}
          aide={etat.dernier_robot ? `robot ${depuis(etat.dernier_robot)}` : 'robot jamais passé'} />
      </GrilleKpi>

      {direct && (
        <CarteAdmin titre="Depuis ce navigateur, maintenant" texte="Résultat du contrôle que vous venez de lancer (noté en base avec la source « admin »).">
          <TableControles lignes={direct} />
        </CarteAdmin>
      )}

      <CarteAdmin titre="Services surveillés" texte="Un contrôle = une vraie requête, chronométrée, faite par le robot (GitHub Actions, toutes les 30 min) ou depuis ce navigateur. Disponibilité = part des contrôles réussis ; p95 = 95 % des réponses sont plus rapides que cette valeur.">
        {etat.services.length === 0
          ? <EtatVide Icone={Radar} titre="Aucun contrôle enregistré" texte="Lancez « Contrôler maintenant », puis activez le robot (guide, chapitre « Surveillance »)." />
          : <TableServices services={etat.services} />}
      </CarteAdmin>

      <CarteAdmin titre="Temps de réponse, 48 heures" texte="Moyenne par heure des contrôles réussis.">
        <GraphiquePerformance points={etat.tendance} hauteur={260} />
      </CarteAdmin>

      <CarteAdmin titre="Historique des contrôles" texte="Les 200 derniers contrôles enregistrés (30 jours de conservation)."
        actions={<ToggleGroup libelle="Afficher" masquerLibelle valeur={filtre} onChange={v => { setFiltre(v); setN(PAGE_HISTORIQUE) }}
          options={[{ v: 'tous', l: 'Tous', n: tous.length }, { v: 'echecs', l: 'Échecs', n: echecs.length }]} />}>
        {controles.erreur && <p className="mb-3 text-[13px] text-danger">{controles.erreur}</p>}
        {controles.enCours && !controles.donnees ? <p className="text-[13px] text-gris">Lecture…</p>
          : visibles.length === 0 ? <EtatVide Icone={filtre === 'echecs' ? CheckCircle2 : Radar} titre={filtre === 'echecs' ? 'Aucun contrôle en échec enregistré.' : 'Aucun contrôle enregistré.'} />
          : (
            <>
              <TableControles lignes={visibles} avecDate />
              {visibles.length < (filtre === 'echecs' ? echecs.length : tous.length) && (
                <div className="mt-3 flex justify-center"><Bouton variante="contour" taille="sm" onClick={() => setN(x => x + PAGE_HISTORIQUE)}>Afficher plus</Bouton></div>
              )}
            </>
          )}
      </CarteAdmin>

      <CarteAdmin titre="Qui vous alerte, et quand">
        <ul className="grid gap-3 md:grid-cols-3">
          {([
            [Radar, 'Service externe', 'UptimeRobot ou Better Stack, à créer (guide, chapitre « Surveillance ») : interroge le site et /rest/v1/rpc/sante toutes les 1 à 5 min, e-mail dès qu\'ils ne répondent plus.'],
            [Clock, 'Robot GitHub, toutes les 30 min', 'Un échec, une lenteur trois fois de suite, des blocages ou erreurs en rafale, une clé admin bloquée : le workflow échoue et GitHub envoie un e-mail. Chaque jour à 9 h : rappel des sauvegardes.'],
            [HardDrive, 'Supabase et Netlify', 'Ils envoient eux-mêmes un e-mail avant une mise en pause ou au dépassement d\'un quota.'],
          ] as [LucideIcon, string, string][]).map(([Icone, t, x]) => (
            <li key={t} className="rounded-bloc border border-ligne bg-fond p-4">
              <Icone className="mb-2 h-4 w-4 text-gris" aria-hidden />
              <p className="text-[13px] font-semibold">{t}</p>
              <p className="mt-1 text-[12.5px] leading-[1.55] text-gris">{x}</p>
            </li>
          ))}
        </ul>
      </CarteAdmin>
    </div>
  )
}

export function SupervisionSante() {
  const d = useSupervision()
  const notifier = useNotifier()
  const [direct, setDirect] = useState<Controle[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const lancer = async () => {
    setEnCours(true)
    try { setDirect(await controlerMaintenant()); void d.recharger() } catch (e) { notifier({ ton: 'erreur', message: String((e as Error)?.message ?? e) }) } finally { setEnCours(false) }
  }
  return (
    <>
      <EnTeteSupervision titre="Santé et disponibilité" texte="Contrôles du site, de l'API, de la base, des comptes, des photos et de WhatsApp : état, disponibilité, temps de réponse et historique."
        enCours={d.enCours} onActualiser={d.recharger} lu={d.donnees?.lu}
        actions={<Bouton variante="accent" onClick={() => void lancer()} disabled={enCours}><RefreshCw className={cn('h-4 w-4', enCours && 'animate-spin')} aria-hidden />{enCours ? 'Contrôle…' : 'Contrôler maintenant'}</Bouton>} />
      <CorpsSupervision d={d} kpi={4}>{x => <Sante etat={x.etat} direct={direct} />}</CorpsSupervision>
    </>
  )
}

// ── Sécurité et API ──────────────────────────────────────────────────────────────────────────────

function EvenementsSecurite() {
  const j = useChargement(() => journalTechnique(168, 'securite', null))
  const lignes = (j.donnees ?? []).slice(0, 8)
  return (
    <CarteAdmin titre="Événements de sécurité, 7 jours" texte="Requêtes bloquées, clés admin erronées, accès admin bloqué."
      actions={<Link to="/admin/supervision/journaux" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-admin-info hover:underline">Journal complet<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}>
      {j.enCours && !j.donnees ? <p className="text-[13px] text-gris">Lecture…</p>
        : lignes.length === 0 ? <EtatVide Icone={ShieldCheck} titre="Aucun événement de sécurité" />
        : (
          <Table minWidth={560}>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Quand</TableHead><TableHead>Gravité</TableHead><TableHead>Événement</TableHead></TableRow></TableHeader>
            <TableBody>{lignes.map((e, i) => (
              <TableRow key={`${e.quand}-${i}`}>
                <TableCell className="whitespace-nowrap tabular-nums text-gris">{formatDate(e.quand)}</TableCell>
                <TableCell><Pastille ton={e.gravite === 'critique' ? 'encre' : e.gravite === 'erreur' ? 'danger' : e.gravite === 'avertissement' ? 'alerte' : 'neutre'}>{e.gravite}</Pastille></TableCell>
                <TableCell>{e.message}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
    </CarteAdmin>
  )
}

function Securite({ etat, stats }: { etat: EtatSupervision; stats: StatistiquesSupervision }) {
  const acceptes = etat.appels_par_action_24h.reduce((a, x) => a + x.acceptes, 0)
  const bloques = etat.appels_par_action_24h.reduce((a, x) => a + x.bloques, 0)
  return (
    <div className="flex flex-col gap-5">
      <GrilleKpi colonnes={5}>
        <KpiCarte Icone={CheckCircle2} libelle="Appels acceptés, 24 h" valeur={acceptes} />
        <KpiCarte Icone={ShieldAlert} libelle="Bloqués (429), 24 h" valeur={bloques} ton={bloques > 0 ? 'alerte' : 'normal'}
          part={acceptes + bloques > 0 ? { valeur: bloques, max: acceptes + bloques, ton: bloques > 0 ? 'alerte' : 'succes' } : undefined}
          aide={acceptes + bloques > 0 ? `${pourcent(Math.round((bloques / (acceptes + bloques)) * 1000) / 10)} des appels` : undefined} />
        <KpiCarte Icone={ShieldAlert} libelle="Bloqués, 7 jours" valeur={stats.limites.bloques_7j} ton={stats.limites.bloques_7j > 0 ? 'alerte' : 'normal'} />
        <KpiCarte Icone={AlertTriangle} libelle="Événements de sécurité, 24 h" valeur={etat.compteurs_24h.securite} ton={etat.compteurs_24h.securite > 0 ? 'alerte' : 'normal'} />
        <KpiCarte Icone={Users} libelle="Visiteurs suspects, 7 jours" valeur={stats.limites.suspects.length} ton={stats.limites.suspects.length > 0 ? 'danger' : 'normal'} aide="5 blocages ou plus" />
      </GrilleKpi>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <CarteAdmin titre="Consommation de l'API publique, 24 h" texte="Écritures publiques acceptées et bloquées, par action. Le nombre total de requêtes (lectures comprises) se lit seulement dans le tableau de bord Supabase.">
          <GraphiqueLimites actions={etat.appels_par_action_24h} libelles={LIBELLES_ACTIONS} />
          <div className="mt-3"><LienExterne href={`${tableauSupabase}/reports`}>Requêtes totales (Supabase)</LienExterne></div>
        </CarteAdmin>
        <EvenementsSecurite />
      </div>

      <CarteAdmin titre="Endpoints surveillés et limites" texte="Limites appliquées par la base à chaque écriture publique (passer_limite). Au-delà, la base répond « 429 Trop de requêtes » avec le délai d'attente (Retry-After) et garde une trace du blocage. Le visiteur est reconnu par une empreinte de son adresse (falsifiable) : le plafond global tient même dans ce cas.">
        <Table minWidth={900}>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead>Action</TableHead><TableHead>Endpoint</TableHead><TableHead>Par visiteur</TableHead><TableHead>Tous visiteurs</TableHead><TableHead>24 h : acceptées / bloquées</TableHead><TableHead>Pourquoi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {stats.limites.regles.map(r => {
              const a = etat.appels_par_action_24h.find(x => x.action === r.action)
              return (
                <TableRow key={r.action} className="align-top">
                  <TableCell className="font-medium">{r.description}<span className="block font-mono text-[11px] font-normal text-gris">{r.action}</span></TableCell>
                  <TableCell className="font-mono text-[11.5px] text-gris">{(ENDPOINTS[r.action]?.fonctions ?? ['—']).map(f => <span key={f} className="block whitespace-nowrap">POST /rpc/{f}</span>)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{r.maximum} / {r.fenetre_minutes} min</TableCell>
                  <TableCell className="tabular-nums">{r.maximum_global ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{a?.acceptes ?? 0} / <span className={cn(a?.bloques && 'font-medium text-danger')}>{a?.bloques ?? 0}</span></TableCell>
                  <TableCell className="min-w-[240px] text-[12px] leading-[1.5] text-gris">{JUSTIFICATIONS[r.action] ?? '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CarteAdmin>

      <div className="grid gap-5 xl:grid-cols-2">
        <CarteAdmin titre="Activité anormale, 7 jours" texte="Visiteurs (empreinte, jamais l'adresse) bloqués 5 fois ou plus.">
          {stats.limites.suspects.length === 0 ? <EtatVide Icone={ShieldCheck} titre="Rien à signaler." /> : (
            <Table minWidth={460}>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Visiteur</TableHead><TableHead>Action</TableHead><TableHead>Blocages</TableHead><TableHead>Dernier</TableHead></TableRow></TableHeader>
              <TableBody>{stats.limites.suspects.map(s => (
                <TableRow key={`${s.visiteur}-${s.action}`}>
                  <TableCell className="font-mono">{s.visiteur}…</TableCell><TableCell>{s.action}</TableCell>
                  <TableCell className="tabular-nums font-medium text-danger">{s.bloques}</TableCell><TableCell className="whitespace-nowrap text-gris">{formatDate(s.dernier)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CarteAdmin>
        <CarteAdmin titre="Derniers blocages">
          {stats.limites.historique.length === 0 ? <EtatVide Icone={ShieldCheck} titre="Aucun blocage enregistré." /> : (
            <Table minWidth={420}>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Quand</TableHead><TableHead>Action</TableHead><TableHead>Visiteur</TableHead></TableRow></TableHeader>
              <TableBody>{stats.limites.historique.slice(0, 10).map((h, i) => (
                <TableRow key={i}><TableCell className="whitespace-nowrap tabular-nums text-gris">{formatDate(h.cree_le)}</TableCell><TableCell>{h.action}</TableCell><TableCell className="font-mono text-gris">{h.visiteur}…</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CarteAdmin>
      </div>

      <CarteAdmin titre="Protections en place">
        <ul className="grid gap-x-6 gap-y-2.5 text-[13px] leading-[1.55] text-gris md:grid-cols-2">
          {[
            'Droits vérifiés par la base (RLS) : chaque client ne lit que ses données ; l\'administration exige le compte, le mot de passe et la clé.',
            'Clé admin : 5 erreurs = 15 min de blocage, chaque erreur notée dans le journal ; session déverrouillée 12 h au plus.',
            'Commande : prix, pièce, coloris, taille et ville vérifiés par la base ; limite par visiteur et plafond global.',
            'Comptes (inscription, connexion, e-mails) : limites propres à Supabase Auth, réglables dans son tableau de bord.',
            'Hébergement : CSP stricte, protection contre l\'intégration dans une autre page, HTTPS imposé.',
          ].map(t => <li key={t} className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-succes" aria-hidden />{t}</li>)}
        </ul>
        <div className="mt-4"><LienExterne href={`${tableauSupabase}/auth/rate-limits`}>Limites de Supabase Auth</LienExterne></div>
      </CarteAdmin>
    </div>
  )
}

export function SupervisionSecurite() {
  const d = useSupervision()
  return (
    <>
      <EnTeteSupervision titre="Sécurité et API" texte="Limitation des requêtes, appels acceptés et bloqués, endpoints surveillés, activité anormale et événements de sécurité."
        enCours={d.enCours} onActualiser={d.recharger} lu={d.donnees?.lu} />
      <CorpsSupervision d={d} kpi={5}>{x => <Securite etat={x.etat} stats={x.stats} />}</CorpsSupervision>
    </>
  )
}

// ── Maintenance et sauvegardes ───────────────────────────────────────────────────────────────────

const LIBELLE_SAUVEGARDE = { manuelle: 'Sauvegarde', restauration_testee: 'Restauration testée', echec: 'Échec' } as const

function Sauvegardes({ onNote }: { onNote: () => void }) {
  const notifier = useNotifier()
  const liste = useChargement(listerSauvegardes)
  const [note, setNote] = useState('')
  const [type, setType] = useState<Sauvegarde['type']>('manuelle')
  const [envoi, setEnvoi] = useState(false)
  const noter = async (e: FormEvent) => {
    e.preventDefault(); setEnvoi(true)
    try { await noterSauvegarde(type, note); setNote(''); void liste.recharger(); onNote(); notifier({ ton: 'succes', message: 'Noté.' }) }
    catch (er) { notifier({ ton: 'erreur', message: String((er as Error)?.message ?? er) }) } finally { setEnvoi(false) }
  }
  return (
    <CarteAdmin titre="Historique des sauvegardes" texte={<>Sur l'offre gratuite de Supabase, aucune sauvegarde restaurable n'est faite pour vous. <code>npm run sauvegarde</code> copie la base sur votre ordinateur et la note ici ; <code>npm run sauvegarde:tester</code> la restaure dans une base jetable pour prouver qu'elle marche. Une sauvegarde n'est fiable qu'une fois sa restauration testée.</>}>
      {liste.erreur && <p className="mb-3 text-[13px] text-danger">{liste.erreur}</p>}
      <form onSubmit={e => void noter(e)} className="mb-5 grid gap-3 rounded-bloc border border-ligne bg-fond p-4 md:grid-cols-[200px_1fr_auto] md:items-end">
        <Selection label="Type" value={type} onChange={e => setType(e.target.value as Sauvegarde['type'])}>
          <option value="manuelle">Sauvegarde faite</option><option value="restauration_testee">Restauration testée</option>
        </Selection>
        <Champ label="Note (facultatif)" maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="Fichier rangé sur le disque externe" />
        <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Noter'}</Bouton>
      </form>
      {(liste.donnees?.length ?? 0) === 0 ? <EtatVide Icone={DatabaseBackup} titre="Aucune sauvegarde notée." texte="Lancez npm run sauvegarde dans web/ : le script la note ici tout seul." /> : (
        <Table minWidth={520}>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Quand</TableHead><TableHead>Type</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
          <TableBody>{liste.donnees!.map(s => (
            <TableRow key={s.id}>
              <TableCell className="whitespace-nowrap tabular-nums text-gris">{formatDate(s.cree_le)}</TableCell>
              <TableCell><Pastille ton={s.type === 'echec' ? 'danger' : s.type === 'restauration_testee' ? 'succes' : 'info'} point>{LIBELLE_SAUVEGARDE[s.type]}</Pastille></TableCell>
              <TableCell className="text-gris">{s.note || '—'}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </CarteAdmin>
  )
}

function Maintenance({ etat, onNote }: { etat: EtatSupervision; onNote: () => void }) {
  const enLigne = useChargement(versionEnLigne)
  const republications = useChargement(dernieresRepublications)
  const v = enLigne.donnees
  const differente = !!v && v.version !== VERSION_SITE
  const jS = joursDepuis(etat.sauvegardes.derniere)
  const jR = joursDepuis(etat.sauvegardes.derniere_restauration)
  const taches = useMemo(() => [
    { t: 'Sauvegarde de la base', regle: 'chaque semaine, et avant chaque mise à jour de la base', ok: jS !== null && jS <= 7, etat: jS === null ? 'jamais faite' : `il y a ${jS} jour${jS > 1 ? 's' : ''}` },
    { t: 'Restauration testée', regle: 'une fois par mois', ok: jR !== null && jR <= 35, etat: jR === null ? 'jamais testée' : `il y a ${jR} jour${jR > 1 ? 's' : ''}` },
    { t: 'Robot de surveillance', regle: 'un passage toutes les 30 min', ok: !robotEnRetard(etat), etat: etat.dernier_robot ? depuis(etat.dernier_robot) : 'jamais passé' },
    { t: 'Version publiée', regle: 'la même que celle de ce navigateur', ok: !!v && !differente, etat: enLigne.enCours ? 'lecture…' : v ? (differente ? 'différente : rechargez la page' : 'à jour') : 'version.json introuvable' },
  ], [jS, jR, etat, v, differente, enLigne.enCours])
  const faites = taches.filter(t => t.ok).length
  return (
    <div className="flex flex-col gap-5">
      <GrilleKpi>
        <KpiCarte Icone={GitCommitHorizontal} libelle="Version en ligne" valeur={v ? v.version.slice(0, 7) : null} ton={differente ? 'alerte' : 'normal'} aide={v ? `construite ${formatDate(v.construit_le)}` : enLigne.enCours ? 'lecture…' : 'version.json introuvable'} />
        <KpiCarte Icone={DatabaseBackup} libelle="Dernière sauvegarde réussie" valeur={jS === null ? 'Aucune' : jS} unite={jS === null ? undefined : jS > 1 ? 'jours' : 'jour'} ton={jS === null || jS > 7 ? 'danger' : 'normal'}
          aide={etat.sauvegardes.derniere ? formatDate(etat.sauvegardes.derniere) : undefined} />
        <KpiCarte Icone={CheckCircle2} libelle="Restauration testée" valeur={jR === null ? 'Jamais' : jR} unite={jR === null ? undefined : jR > 1 ? 'jours' : 'jour'} ton={jR === null || jR > 35 ? 'danger' : 'normal'}
          aide={etat.sauvegardes.dernier_echec ? `dernier échec : ${formatDate(etat.sauvegardes.dernier_echec)}` : 'aucun échec noté'} />
        <KpiCarte Icone={Rocket} libelle="Déploiements vus" valeur={etat.deploiements.length} aide={etat.deploiements[0] ? `dernier ${depuis(etat.deploiements[0].vu_le)}` : 'aucun encore'} />
      </GrilleKpi>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <CarteAdmin titre="Tâches de maintenance" texte="Ce qui doit être à jour, lu dans la base et en ligne." actions={<Pastille ton={faites === taches.length ? 'succes' : 'alerte'} point>{faites} / {taches.length} à jour</Pastille>}>
          <Progress className="mb-4" valeur={faites} max={taches.length} ton={faites === taches.length ? 'succes' : 'alerte'} libelle="Tâches de maintenance à jour" />
          <ul className="flex flex-col divide-y divide-ligne">
            {taches.map(t => (
              <li key={t.t} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                {t.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-succes" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{t.t}<span className="sr-only"> : {t.ok ? 'à jour' : 'à faire'}</span></p>
                  <p className="text-[12px] text-gris">{t.regle}</p>
                </div>
                <span className={cn('shrink-0 text-right text-[12px]', t.ok ? 'text-gris' : 'font-medium text-danger')}>{t.etat}</span>
              </li>
            ))}
          </ul>
        </CarteAdmin>

        <CarteAdmin titre="Version et déploiements" texte="La version de ce navigateur, celle publiée en ligne, et chaque nouvelle version vue par le robot ou par l'admin.">
          <dl className="mb-5 grid gap-3 text-[13px] sm:grid-cols-2">
            <div className="rounded-bloc border border-ligne bg-fond p-3"><dt className="text-[12px] text-gris">Ce navigateur</dt><dd className="mt-1 break-all font-mono text-[12.5px]">{VERSION_SITE}{CONSTRUIT_LE && <span className="block font-sans text-[12px] text-gris">construite le {formatDate(CONSTRUIT_LE)}</span>}</dd></div>
            <div className="rounded-bloc border border-ligne bg-fond p-3"><dt className="text-[12px] text-gris">En ligne</dt><dd className="mt-1 break-all font-mono text-[12.5px]">{enLigne.enCours ? '…' : v ? <>{v.version}<span className="block font-sans text-[12px] text-gris">{formatDate(v.construit_le)}{differente && <strong className="text-danger"> — différente</strong>}</span></> : 'version.json introuvable'}</dd></div>
          </dl>
          {etat.deploiements.length === 0 ? <EtatVide Icone={Rocket} titre="Aucun déploiement vu" texte="Le robot les note à son passage, l'admin quand il lance un contrôle sur le site en ligne." /> : (
            <ol className="relative flex flex-col gap-3 border-l border-ligne pl-4">
              {etat.deploiements.map((d, i) => (
                <li key={d.version} className="relative">
                  <span className={cn('absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-fond-2', i === 0 ? 'bg-admin-accent' : 'bg-gris-clair')} aria-hidden />
                  <p className="font-mono text-[12.5px]">{d.version.slice(0, 12)}{i === 0 && <span className="ml-2 font-sans"><Pastille ton="accent">dernière</Pastille></span>}</p>
                  <p className="text-[12px] text-gris">construite {d.construit_le ? formatDate(d.construit_le) : '—'} · vue {formatDate(d.vu_le)}</p>
                </li>
              ))}
            </ol>
          )}
          <p className="mb-2 mt-5 text-[12px] font-medium text-gris">Aperçus de partage republiés par le robot</p>
          {(republications.donnees?.length ?? 0) === 0
            ? <p className="text-[12.5px] text-gris">Aucune republication automatique (build hook Netlify non fourni au robot, ou catalogue inchangé).</p>
            : <ul className="divide-y divide-ligne text-[12.5px]">{republications.donnees!.map(r => <li key={r.cree_le} className="py-1.5"><span className="tabular-nums text-gris">{formatDate(r.cree_le)}</span> · {r.raison}</li>)}</ul>}
        </CarteAdmin>
      </div>

      <Sauvegardes onNote={onNote} />

      <CarteAdmin titre="Tableaux de bord des fournisseurs" texte="Le nombre total de requêtes à l'API, les journaux internes (SQL, comptes, stockage) et l'usage des quotas ne se lisent pas depuis le site sans clé secrète.">
        <TitreSection>Code et déploiements</TitreSection>
        <div className="mb-4 flex flex-wrap gap-2">
          <LienExterne href={`${DEPOT}/actions`}>CI et robot (GitHub Actions)</LienExterne>
          <LienExterne href={`${DEPOT}/commits/main`}>Historique des modifications</LienExterne>
          <LienExterne href="https://app.netlify.com/">Déploiements (Netlify)</LienExterne>
        </div>
        <TitreSection>Base et quotas</TitreSection>
        <div className="flex flex-wrap gap-2">
          <LienExterne href={`${tableauSupabase}/logs/explorer`}>Journaux Supabase</LienExterne>
          <LienExterne href={`${tableauSupabase}/reports`}>Rapports d'usage (requêtes API)</LienExterne>
          <LienExterne href={`${tableauSupabase}/database/backups/scheduled`}>Sauvegardes Supabase</LienExterne>
          <LienExterne href="https://app.netlify.com/teams">Usage Netlify (crédits)</LienExterne>
        </div>
      </CarteAdmin>
    </div>
  )
}

export function SupervisionMaintenance() {
  const d = useSupervision()
  return (
    <>
      <EnTeteSupervision titre="Maintenance et sauvegardes" texte="Sauvegardes et restaurations testées, version publiée, déploiements et tâches de maintenance."
        enCours={d.enCours} onActualiser={d.recharger} lu={d.donnees?.lu} />
      <CorpsSupervision d={d} kpi={4}>{x => <Maintenance etat={x.etat} onNote={() => void d.recharger()} />}</CorpsSupervision>
    </>
  )
}
