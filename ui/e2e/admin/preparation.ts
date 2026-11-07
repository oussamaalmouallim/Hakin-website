import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

/** Compte admin jetable pour la suite : inscription, confirmation par Mailpit, droit admin donné en SQL (conteneur local). */
export const FICHIER_COMPTE = 'rapports/playwright-admin-compte.json'
const MAILPIT = 'http://127.0.0.1:54324'
export const psql = (sql: string) =>
  execFileSync('docker', ['exec', 'supabase_db_hmode', 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', sql], { encoding: 'utf8' }).trim()

export default async function preparation() {
  const url = process.env.ADMIN_SUPABASE_URL!, cle = process.env.ADMIN_SUPABASE_CLE!
  const suffixe = Date.now().toString(36)
  const email = `admin.e2e.${suffixe}@exemple.ma`
  const motDePasse = `Admin-${suffixe}-9`
  const sb = createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await sb.auth.signUp({ email, password: motDePasse, options: { data: { nom: 'Admin Essai' }, emailRedirectTo: 'http://localhost:6014/connexion' } })
  if (error) throw error
  let lien = ''
  for (let i = 0; i < 30 && !lien; i++) {
    const liste = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`).then(r => r.json())
    const m = liste.messages?.[0]
    if (m) lien = ((await fetch(`${MAILPIT}/api/v1/message/${m.ID}`).then(r => r.json())).Text.match(/https?:\/\/\S+verify\S+/) ?? [''])[0].replace(/[)\]>]+$/, '')
    else await new Promise(r => setTimeout(r, 300))
  }
  if (!lien) throw new Error('e-mail de confirmation non reçu (Mailpit)')
  await fetch(lien, { redirect: 'manual' })
  psql(`insert into public.admins (utilisateur) select id from auth.users where email = '${email}' on conflict do nothing`)
  writeFileSync(FICHIER_COMPTE, JSON.stringify({ email, motDePasse, suffixe }))
}
