// Sauvegarde de la base EN LIGNE sur cet ordinateur : `npm run sauvegarde` (dans web/).
// Prérequis : `npx supabase login` fait une fois, et le projet relié (`npx supabase link`), à la racine du dépôt.
// Produit ~/Documents/HMODE-sauvegardes/<date>/ : roles.sql, schema.sql, donnees.sql, photos/ (stockage), manifeste.json
// (taille et empreinte SHA-256 de chaque fichier, nombre de lignes de chaque table au moment de la copie).
// Note ensuite la sauvegarde dans l'admin (Supervision → Maintenance) avec le jeton du robot (SANTE_JETON de web/.env),
// sinon dit de la noter à la main. Ne lit que des données : rien n'est modifié en ligne. N'affiche aucune donnée.
// Le dossier contient des données de clients : il reste hors du dépôt, dossier réservé à votre compte (droits 700).
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const RACINE = resolve(import.meta.dirname, '../..')
const DOSSIER = process.env.SAUVEGARDE_DOSSIER || join(homedir(), 'Documents', 'HMODE-sauvegardes')
const horodatage = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h')
const cible = join(DOSSIER, horodatage)

const cli = (args, options = {}) => execFileSync('npx', ['supabase', ...args, '--workdir', RACINE], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256e6, ...options })
const lireJson = sortie => JSON.parse(sortie.slice(sortie.indexOf('{')))

async function noter(type, note) {
  const url = process.env.VITE_SUPABASE_URL, cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY, jeton = process.env.SANTE_JETON
  if (!url || !cle || !jeton) { console.log('ℹ SANTE_JETON absent de web/.env : notez cette sauvegarde à la main (admin → Supervision → Maintenance).'); return }
  try {
    const r = await fetch(`${url}/rest/v1/rpc/noter_sauvegarde_script`, {
      method: 'POST', headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jeton, p_type: type, p_note: note }), signal: AbortSignal.timeout(15000),
    })
    const d = r.ok ? await r.json() : { ok: false, message: `HTTP ${r.status}` }
    console.log(d.ok ? '✓ Notée dans l\'admin (Supervision → Maintenance).' : `✗ Non notée dans l'admin : ${d.message}`)
  } catch (e) { console.log(`✗ Non notée dans l'admin : ${String(e?.cause?.code ?? e)}`) }
}

if (!existsSync(join(RACINE, 'supabase', '.temp', 'project-ref'))) {
  console.error('✗ Projet non relié. À la racine du dépôt : npx supabase login, puis npx supabase link --project-ref <réf du projet>.')
  process.exit(1)
}
mkdirSync(cible, { recursive: true, mode: 0o700 })
chmodSync(DOSSIER, 0o700)
console.log(`Sauvegarde vers ${cible}`)
try {
  // 1. Les comptes de nombres de lignes d'abord : la restauration testée les comparera.
  const comptes = lireJson(cli(['db', 'query', '--remote', '--read-only', `select t.table_schema || '.' || t.table_name as t,
    (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text::int as n
    from information_schema.tables t where t.table_type = 'BASE TABLE'
    and (t.table_schema = 'public' or (t.table_schema, t.table_name) in (('auth', 'users'), ('storage', 'objects'), ('storage', 'buckets'))) order by 1`]))
    .rows.reduce((acc, r) => ({ ...acc, [r.t]: r.n }), {})
  // 2. Rôles, structure, données (méthode de la documentation Supabase : « Backup and restore using the CLI »).
  cli(['db', 'dump', '--remote', '--role-only', '-f', join(cible, 'roles.sql')])
  cli(['db', 'dump', '--remote', '-f', join(cible, 'schema.sql')])
  cli(['db', 'dump', '--remote', '--data-only', '--use-copy', '-f', join(cible, 'donnees.sql')])
  // 3. Les photos téléversées depuis l'admin (bucket « produits ») : les fichiers ne sont pas dans la base.
  let photos = 'aucune'
  if ((comptes['storage.objects'] ?? 0) > 0) {
    try { cli(['storage', 'cp', '-r', 'ss:///produits', join(cible, 'photos'), '--experimental', '--remote']); photos = 'copiées' }
    catch (e) { photos = `NON copiées (${String(e.stderr ?? e).split('\n').find(Boolean)?.slice(0, 120)})` }
  }
  const fichiers = {}
  const parcourir = d => readdirSync(d).forEach(f => { const p = join(d, f); if (statSync(p).isDirectory()) parcourir(p); else fichiers[p.slice(cible.length + 1)] = { octets: statSync(p).size, sha256: createHash('sha256').update(readFileSync(p)).digest('hex') } })
  parcourir(cible)
  const manifeste = { cree_le: new Date().toISOString(), projet: readFileSync(join(RACINE, 'supabase', '.temp', 'project-ref'), 'utf8').trim(), comptes, photos, fichiers }
  writeFileSync(join(cible, 'manifeste.json'), JSON.stringify(manifeste, null, 2), { mode: 0o600 })
  const vide = ['roles.sql', 'schema.sql', 'donnees.sql'].filter(f => !(fichiers[f]?.octets > 0))
  if (vide.length) throw new Error(`fichier vide : ${vide.join(', ')}`)
  const ko = Object.values(fichiers).reduce((a, f) => a + f.octets, 0) / 1024
  console.log(`✓ ${Object.keys(fichiers).length} fichiers, ${Math.round(ko)} Ko · ${comptes['public.produits'] ?? 0} produits, ${comptes['public.commandes'] ?? 0} commandes, ${comptes['auth.users'] ?? 0} comptes · photos : ${photos}`)
  console.log('  Copiez ce dossier sur un second support (disque externe ou cloud chiffré), puis testez-le : npm run sauvegarde:tester')
  await noter('manuelle', `${horodatage} · ${Math.round(ko)} Ko · ${comptes['public.commandes'] ?? 0} commandes · photos ${photos}`)
} catch (e) {
  const message = String(e.stderr || e.message || e).split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 250)
  console.error(`✗ Sauvegarde échouée : ${message}`)
  await noter('echec', `${horodatage} : ${message}`)
  process.exit(1)
}
