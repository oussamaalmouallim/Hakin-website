import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

/** Compte admin jetable, créé comme en vrai : `scripts/admin-sql.mjs` (e-mail, mot de passe, clé) → SQL passé à la base
 *  locale. Pas d'inscription par le site. La clé d'avant est rendue par le rangement. */
export const CLE_ESSAI = 'essai E2E-clé'
export const FICHIER_COMPTE = 'rapports/playwright-admin-compte.json'
export const psql = (sql: string) =>
  execFileSync('docker', ['exec', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', sql], { encoding: 'utf8' }).trim()

export default async function preparation() {
  const suffixe = Date.now().toString(36)
  const email = `admin.e2e.${suffixe}@exemple.ma`
  const motDePasse = `Admin-${suffixe}-9`
  const ancienneCle = psql('select hash from public.admin_cle where id = 1')
  const sql = execFileSync('node', ['scripts/admin-sql.mjs'], {
    encoding: 'utf8', env: { PATH: process.env.PATH, ADMIN_EMAIL: email, ADMIN_MOT_DE_PASSE: motDePasse, ADMIN_CLE: CLE_ESSAI },
  })
  const sortie = execFileSync('docker', ['exec', '-i', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA'],
    { input: sql, encoding: 'utf8' })
  if (!sortie.includes(email)) throw new Error('compte admin non créé par admin-sql.mjs')
  writeFileSync(FICHIER_COMPTE, JSON.stringify({ email, motDePasse, suffixe, ancienneCle }))
}
