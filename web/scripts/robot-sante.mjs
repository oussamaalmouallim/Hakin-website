// Robot de surveillance : contrôle le site en ligne et ses services, puis écrit le résultat en base
// (`enregistrer_controles`). Lancé toutes les 30 min par .github/workflows/sante.yml ; à la main : npm run robot:sante.
// Variables : SITE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (publiques) et SANTE_JETON (secret).
// Facultatif : NETLIFY_BUILD_HOOK (secret) — relance le build quand le catalogue a changé depuis le dernier
// (pour mettre à jour les aperçus de partage des fiches) ; la base décide, au plus une fois toutes les 12 h.
// Code de sortie 1 si un contrôle échoue ou si la base signale une alerte : GitHub prévient alors par e-mail.
// N'affiche jamais le jeton ni la clé.
const site = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
const sb = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
const jeton = process.env.SANTE_JETON ?? ''
const manque = Object.entries({ SITE_URL: site, VITE_SUPABASE_URL: sb, VITE_SUPABASE_PUBLISHABLE_KEY: cle, SANTE_JETON: jeton }).filter(([, v]) => !v).map(([k]) => k)
if (manque.length) { console.error(`✗ Variables manquantes : ${manque.join(', ')}`); process.exit(1) }

const entetesSb = { apikey: cle, Authorization: `Bearer ${cle}` }

/** Une requête chronométrée ; `attendu` reçoit la réponse et renvoie un détail d'erreur ou rien. */
async function controler(cible, url, options = {}, attendu = r => (r.ok ? '' : `HTTP ${r.status}`)) {
  const debut = performance.now()
  try {
    const r = await fetch(url, { ...options, redirect: options.redirect ?? 'follow', signal: AbortSignal.timeout(15000) })
    const detail = await attendu(r)
    return { cible, ok: !detail, statut_http: r.status, duree_ms: Math.round(performance.now() - debut), detail: detail || '' }
  } catch (e) {
    return { cible, ok: false, statut_http: 0, duree_ms: Math.round(performance.now() - debut), detail: String(e?.cause?.code ?? e?.name ?? e).slice(0, 200) }
  }
}

// Une photo réelle du catalogue, pour vérifier le stockage des images.
async function photoDuCatalogue() {
  try {
    const r = await fetch(`${sb}/rest/v1/produits?select=images&publie=eq.true&limit=20`, { headers: entetesSb, signal: AbortSignal.timeout(15000) })
    const lignes = r.ok ? await r.json() : []
    for (const l of lignes) for (const i of l.images ?? []) if (/^https?:\/\//.test(i.src ?? '')) return i.src
  } catch { /* le contrôle de la base le signalera */ }
  return null
}

let versionVue = null // { version, construit_le } lue dans /version.json : la base note chaque nouveau déploiement
const resultats = await Promise.all([
  controler('site : accueil', `${site}/`, {}, async r => (!r.ok ? `HTTP ${r.status}` : (await r.text()).includes('id="racine"') ? '' : 'page sans application')),
  controler('site : boutique', `${site}/boutique`),
  controler('site : version', `${site}/version.json`, {}, async r => {
    if (!r.ok) return `HTTP ${r.status}`
    const v = await r.json().catch(() => null)
    if (!v?.version) return 'version.json illisible'
    versionVue = { version: String(v.version), construit_le: v.construit_le ?? null }
    return ''
  }),
  // Le même point que le service de surveillance externe : GET, l'API répond et la base lit une table.
  controler('base : santé (GET)', `${sb}/rest/v1/rpc/sante`, { headers: entetesSb }, async r => (!r.ok ? `HTTP ${r.status}` : (await r.json().catch(() => null))?.ok === true ? '' : 'réponse inattendue')),
  controler('site : vrai 404', `${site}/adresse-inexistante-robot`, {}, r => (r.status === 404 ? '' : `HTTP ${r.status} au lieu de 404`)),
  controler('base : API et données', `${sb}/rest/v1/reglages?select=cle&limit=1`, { headers: entetesSb }),
  controler('base : comptes (Auth)', `${sb}/auth/v1/health`, { headers: entetesSb }),
  controler('WhatsApp (wa.me)', 'https://wa.me/', { method: 'HEAD', redirect: 'manual' }, r => (r.status < 500 ? '' : `HTTP ${r.status}`)),
])
const photo = await photoDuCatalogue()
resultats.push(photo
  ? await controler('stockage : photos', photo, { method: 'HEAD' })
  : { cible: 'stockage : photos', ok: true, statut_http: null, duree_ms: null, detail: 'aucune photo en ligne dans le catalogue : non vérifié' })

if (versionVue) Object.assign(resultats.find(r => r.cible === 'site : version'), versionVue)
for (const r of resultats) console.log(`${r.ok ? '✓' : '✗'} ${r.cible} — ${r.statut_http ?? '-'} en ${r.duree_ms ?? '-'} ms${r.detail ? ` (${r.detail})` : ''}`)

let reponse
try {
  const r = await fetch(`${sb}/rest/v1/rpc/enregistrer_controles`, {
    method: 'POST', headers: { ...entetesSb, 'Content-Type': 'application/json' },
    body: JSON.stringify({ jeton, resultats }), signal: AbortSignal.timeout(15000),
  })
  reponse = r.ok ? await r.json() : { ok: false, message: `HTTP ${r.status}` }
} catch (e) { reponse = { ok: false, message: String(e?.cause?.code ?? e) } }

if (!reponse?.ok) console.error(`✗ Résultats non enregistrés : ${reponse?.message ?? 'réponse vide'}`)
for (const a of reponse?.alertes ?? []) console.error(`⚠ ${a}`)
// Republication des aperçus : seulement si un build hook est fourni et que la base dit que le catalogue a changé.
const hook = process.env.NETLIFY_BUILD_HOOK ?? ''
if (hook && reponse?.ok) {
  try {
    const v = await fetch(`${site}/version.json`, { signal: AbortSignal.timeout(15000) }).then(r => r.json())
    const r = await fetch(`${sb}/rest/v1/rpc/republication_necessaire`, {
      method: 'POST', headers: { ...entetesSb, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jeton, construit_le: v.construit_le }), signal: AbortSignal.timeout(15000),
    })
    if (r.ok && (await r.json()) === true) {
      const b = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(15000) })
      console.log(b.ok ? '↻ Catalogue modifié depuis le dernier build : nouveau build demandé à Netlify.' : `✗ Build hook refusé : HTTP ${b.status}`)
    }
  } catch (e) { console.error(`✗ Republication non vérifiée : ${String(e?.cause?.code ?? e)}`) }
}

const echec = resultats.some(r => !r.ok) || !reponse?.ok || (reponse.alertes ?? []).length > 0
console.log(echec ? '\nAnomalie : voir ci-dessus.' : '\nTout est en ordre.')
process.exit(echec ? 1 : 0)
