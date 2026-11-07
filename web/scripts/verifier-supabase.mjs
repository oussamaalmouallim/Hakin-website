// Vérifie le schéma Supabase avec la seule clé publique, SANS rien écrire en base.
// Usage : cd web && node --env-file=.env scripts/verifier-supabase.mjs
// Attendu : tables présentes mais fermées aux visiteurs, fonction passer_commande présente (refuse une commande vide).
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !cle) { console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans web/.env'); process.exit(1) }
const h = { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' }

let ok = true
const verdict = (bon, libelle, detail) => { ok &&= bon; console.log(`${bon ? '✓' : '✗'} ${libelle}${detail ? ` — ${detail}` : ''}`) }

for (const table of ['profils', 'adresses', 'paniers', 'commandes', 'lignes_commande']) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers: h })
  const corps = await r.json().catch(() => ({}))
  if (corps.code === 'PGRST205') verdict(false, `table ${table}`, 'absente : coller supabase/schema.sql dans le SQL Editor')
  else if (r.ok && Array.isArray(corps) && corps.length) verdict(false, `table ${table}`, 'LISIBLE PAR UN VISITEUR : vérifier la RLS')
  else verdict(true, `table ${table}`, r.ok ? 'présente, aucune ligne visible sans compte' : `présente, accès refusé sans compte (${corps.code ?? r.status})`)
}

// Écriture directe d'une commande par un visiteur : doit être refusée (aucune ligne créée).
const directe = await fetch(`${url}/rest/v1/commandes`, { method: 'POST', headers: h, body: JSON.stringify({ reference: 'TEST-REFUS', nom: 'x', telephone: '0600000000', ville: 'x', adresse: 'x', sous_total_dh: 0 }) })
verdict(!directe.ok, 'écriture directe dans commandes', directe.ok ? 'ACCEPTÉE : vérifier les droits' : `refusée (${directe.status})`)

// Fonction : une commande vide doit être rejetée par nos contrôles (prouve qu'elle existe, sans rien insérer).
const rpc = await fetch(`${url}/rest/v1/rpc/passer_commande`, { method: 'POST', headers: h, body: JSON.stringify({ commande: { lignes: [] } }) })
const err = await rpc.json().catch(() => ({}))
verdict(!rpc.ok && /Commande vide/.test(err.message ?? ''), 'fonction passer_commande', err.code === 'PGRST202' ? 'absente' : (err.message ?? `statut ${rpc.status}`))

const auth = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: cle } }).then(r => r.json())
console.log(`ℹ inscription par e-mail : ${auth.external?.email ? 'active' : 'inactive'} · confirmation de l'e-mail : ${auth.mailer_autoconfirm ? 'non' : 'oui'}`)
process.exit(ok ? 0 : 1)
