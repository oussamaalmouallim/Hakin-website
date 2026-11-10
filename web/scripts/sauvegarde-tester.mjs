// Test de restauration d'une sauvegarde : `npm run sauvegarde:tester` (la plus récente) ou `npm run sauvegarde:tester -- <dossier>`.
// Démarre un Supabase JETABLE (Docker, ports 553xx, projet « hmode-restauration ») sans aucune migration, y restaure
// roles.sql + schema.sql + donnees.sql comme le dit la documentation Supabase, puis compare le nombre de lignes de chaque
// table au manifeste écrit au moment de la sauvegarde. Arrête et efface ce Supabase jetable à la fin, quoi qu'il arrive.
// Ne touche ni au projet en ligne ni au Supabase local habituel (ports 543xx). N'affiche aucune donnée, seulement des comptes.
// Une sauvegarde n'est fiable qu'une fois ce test passé : il note le résultat dans l'admin (jeton du robot, SANTE_JETON).
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

const RACINE = resolve(import.meta.dirname, '../..')
const DOSSIER = process.env.SAUVEGARDE_DOSSIER || join(homedir(), 'Documents', 'HMODE-sauvegardes')
const PROJET = 'hmode-restauration'
const CONTENEUR = `supabase_db_${PROJET}`

const choisi = process.argv[2] ? resolve(process.argv[2])
  : existsSync(DOSSIER) ? readdirSync(DOSSIER).filter(d => existsSync(join(DOSSIER, d, 'manifeste.json'))).sort().map(d => join(DOSSIER, d)).at(-1) : null
if (!choisi || !existsSync(join(choisi, 'manifeste.json'))) { console.error(`✗ Aucune sauvegarde avec manifeste dans ${DOSSIER}. Lancez d'abord : npm run sauvegarde`); process.exit(1) }
const manifeste = JSON.parse(readFileSync(join(choisi, 'manifeste.json'), 'utf8'))
console.log(`Test de restauration : ${choisi}`)

async function noter(type, note) {
  const url = process.env.VITE_SUPABASE_URL, cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY, jeton = process.env.SANTE_JETON
  if (!url || !cle || !jeton) { console.log('ℹ SANTE_JETON absent de web/.env : notez le résultat à la main (admin → Supervision → Maintenance).'); return }
  try {
    const r = await fetch(`${url}/rest/v1/rpc/noter_sauvegarde_script`, {
      method: 'POST', headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jeton, p_type: type, p_note: note }), signal: AbortSignal.timeout(15000),
    })
    const d = r.ok ? await r.json() : { ok: false, message: `HTTP ${r.status}` }
    console.log(d.ok ? '✓ Résultat noté dans l\'admin.' : `✗ Résultat non noté dans l'admin : ${d.message}`)
  } catch (e) { console.log(`✗ Résultat non noté dans l'admin : ${String(e?.cause?.code ?? e)}`) }
}

// 1. Les fichiers n'ont pas changé depuis la sauvegarde (empreintes SHA-256 du manifeste).
const abimes = Object.entries(manifeste.fichiers).filter(([f, m]) => !existsSync(join(choisi, f)) || createHash('sha256').update(readFileSync(join(choisi, f))).digest('hex') !== m.sha256).map(([f]) => f)
if (abimes.length) { console.error(`✗ Fichiers absents ou modifiés : ${abimes.join(', ')}`); await noter('echec', `${basename(choisi)} : fichiers abîmés`); process.exit(1) }
console.log(`✓ ${Object.keys(manifeste.fichiers).length} fichiers intacts (empreintes identiques au manifeste)`)

// 2. Un Supabase jetable : config du projet, autre nom, ports 553xx, aucune migration.
const temp = mkdtempSync(join(tmpdir(), 'hmode-restauration-'))
mkdirSync(join(temp, 'supabase', 'migrations'), { recursive: true })
const config = readFileSync(join(RACINE, 'supabase', 'config.toml'), 'utf8')
  .replace(/^project_id\s*=.*$/m, `project_id = "${PROJET}"`).replace(/= 543(\d\d)\b/g, '= 553$1')
writeFileSync(join(temp, 'supabase', 'config.toml'), config)
writeFileSync(join(temp, 'supabase', 'seed.sql'), '-- vide : restauration\n')
const cli = args => execFileSync('npx', ['supabase', ...args, '--workdir', temp], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64e6 })
const psql = (fichiers, extra = []) => execFileSync('docker', ['exec', '-i', CONTENEUR, 'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-tA', ...extra],
  { input: fichiers, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 256e6 })

let ok = false
let resume = ''
try {
  console.log('… démarrage du Supabase jetable (1 à 3 min)')
  cli(['start', '-x', 'studio,imgproxy,edge-runtime,logflare,vector,realtime,postgres-meta,supavisor,mailpit'])
  // 3. Restauration : rôles, structure, puis données sans déclencheurs ni contrôles de clés (session_replication_role).
  //    En supabase_admin (super-utilisateur de cette base jetable) : les tables de Storage appartiennent à un autre rôle.
  const lire = f => readFileSync(join(choisi, f), 'utf8')
  psql(`${lire('roles.sql')}\n${lire('schema.sql')}\nSET session_replication_role = replica;\n${lire('donnees.sql')}`, ['--single-transaction'])
  console.log('✓ Restauration sans erreur (une seule transaction)')
  // 4. Mêmes tables, mêmes nombres de lignes qu'au moment de la sauvegarde.
  const ecarts = []
  for (const [table, attendu] of Object.entries(manifeste.comptes)) {
    const [s, t] = table.split('.')
    const n = Number(psql(`select count(*) from "${s}"."${t}"`))
    if (n !== attendu) ecarts.push(`${table} : ${n} au lieu de ${attendu}`)
  }
  const nb = Object.keys(manifeste.comptes).length
  if (ecarts.length) throw new Error(`écarts de lignes : ${ecarts.join(' ; ')}`)
  console.log(`✓ ${nb} tables : mêmes nombres de lignes qu'à la sauvegarde (${manifeste.comptes['public.produits'] ?? 0} produits, ${manifeste.comptes['public.commandes'] ?? 0} commandes, ${manifeste.comptes['auth.users'] ?? 0} comptes)`)
  // 5. La base restaurée fonctionne : les fonctions de la boutique existent, et une lecture passe par les droits (RLS).
  const fonctions = psql(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('passer_commande', 'est_admin', 'passer_limite')`)
  const lecture = psql(`set role anon; select count(*) from public.produits where publie; reset role;`).split('\n').find(Boolean)
  if (Number(fonctions) < 3 || lecture === undefined) throw new Error(`base incomplète (${fonctions}/3 fonctions)`)
  console.log(`✓ Fonctions de la boutique présentes ; un visiteur lit ${lecture} pièce(s) publiée(s) à travers les droits (RLS)`)
  ok = true
  resume = `${basename(choisi)} restaurée : ${nb} tables identiques, ${manifeste.comptes['public.commandes'] ?? 0} commandes`
} catch (e) {
  resume = `${basename(choisi)} : ${String(e.stderr || e.message || e).split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 220)}`
  console.error(`✗ Restauration échouée : ${resume}`)
} finally {
  try { cli(['stop', '--no-backup']) } catch { console.error(`⚠ Arrêt du Supabase jetable à vérifier : npx supabase stop --project-id ${PROJET} --no-backup`) }
  rmSync(temp, { recursive: true, force: true })
  console.log('Supabase jetable arrêté et effacé.')
}
await noter(ok ? 'restauration_testee' : 'echec', resume)
process.exit(ok ? 0 : 1)
