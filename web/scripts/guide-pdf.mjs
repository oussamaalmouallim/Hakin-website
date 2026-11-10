// Guide PDF de déploiement, d'hébergement et de maintenance : `npm run guide:pdf` (dans web/).
// Source : docs/guide-pdf/guide.html + guide.css (contenu et mise en page, charte H MODE).
// Rendu : Chromium (Playwright, déjà installé pour les tests) + Paged.js, qui met en page en A4 : numéros de page du
// sommaire (target-counter), en-têtes et pieds courants, titres jamais seuls en bas de page.
// Sortie : DEPLOIEMENT_ET_SUPERVISION/GUIDE_DEPLOIEMENT_HEBERGEMENT_MAINTENANCE_HMODE.pdf
// Option : `npm run guide:pdf -- --apercus` écrit aussi une image PNG par page dans web/rapports/guide-apercus/ (contrôle visuel).
import { chromium } from '@playwright/test'
import { createReadStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const RACINE = resolve(import.meta.dirname, '../..')
const SORTIE = join(RACINE, 'DEPLOIEMENT_ET_SUPERVISION', 'GUIDE_DEPLOIEMENT_HEBERGEMENT_MAINTENANCE_HMODE.pdf')
const POLYFILL = join(RACINE, 'web', 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js')
const apercus = process.argv.includes('--apercus')

// Paged.js relit les feuilles de style par requête HTTP (interdit en file://) : petit serveur de fichiers éphémère,
// sur 127.0.0.1 et un port choisi par le système, limité aux dossiers utiles, arrêté à la fin du script.
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
const AUTORISES = [join(RACINE, 'docs', 'guide-pdf'), join(RACINE, 'web', 'node_modules', '@fontsource'), join(RACINE, 'web', 'node_modules', 'pagedjs', 'dist')]
const serveur = createServer((req, res) => {
  const chemin = normalize(join(RACINE, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (!AUTORISES.some(d => chemin.startsWith(d + '/')) || !existsSync(chemin) || !statSync(chemin).isFile()) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] ?? 'application/octet-stream' })
  createReadStream(chemin).pipe(res)
}).listen(0, '127.0.0.1')
await new Promise(r => serveur.once('listening', r))
const BASE = `http://127.0.0.1:${serveur.address().port}`

const navigateur = await chromium.launch()
try {
  const page = await navigateur.newPage()
  const erreurs = []
  page.on('pageerror', e => erreurs.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()) })
  await page.addInitScript(() => { window.PagedConfig = { auto: false } })
  await page.goto(`${BASE}/docs/guide-pdf/guide.html`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.addScriptTag({ path: POLYFILL })
  // La page est déjà chargée : on lance la mise en page à la main (auto: false) et on attend qu'elle finisse.
  await page.evaluate(() => window.PagedPolyfill.preview())
  const bilan = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.pagedjs_page')]
    // Contrôles de mise en page : titre seul en bas de page, tableau coupé, débordement horizontal.
    const titresSeuls = [], tableauxCoupes = [], debordements = []
    for (const p of pages) {
      const zone = p.querySelector('.pagedjs_page_content')
      const elements = [...zone.querySelectorAll('h2, h3, h4')]
      const dernier = [...zone.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()).at(-1)
      for (const t of elements) if (dernier && (t === dernier || t.contains(dernier))) titresSeuls.push(`${p.dataset.pageNumber} : ${t.textContent.trim().slice(0, 50)}`)
      for (const t of zone.querySelectorAll('table[data-split-to], table[data-split-from]')) tableauxCoupes.push(`${p.dataset.pageNumber} : ${t.querySelector('th')?.textContent.trim().slice(0, 30) ?? 'tableau'}`)
      for (const e of zone.querySelectorAll('pre, table, .encadre, img, svg')) if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') debordements.push(`${p.dataset.pageNumber} : ${e.tagName.toLowerCase()}`)
    }
    const sommaire = [...document.querySelectorAll('.sommaire a')].length
    return { pages: pages.length, titresSeuls, tableauxCoupes: [...new Set(tableauxCoupes)], debordements, sommaire }
  })
  await page.pdf({ path: SORTIE, printBackground: true, preferCSSPageSize: true, tagged: true, outline: true })
  console.log(`✓ ${bilan.pages} pages → ${SORTIE.replace(RACINE + '/', '')}`)
  console.log(`  sommaire : ${bilan.sommaire} entrées ; titres seuls en bas de page : ${bilan.titresSeuls.length} ; tableaux coupés : ${bilan.tableauxCoupes.length} ; débordements : ${bilan.debordements.length}`)
  for (const l of [...bilan.titresSeuls, ...bilan.tableauxCoupes.map(t => `tableau coupé p. ${t}`), ...bilan.debordements.map(d => `débordement p. ${d}`)]) console.log(`  ⚠ ${l}`)
  if (erreurs.length) console.log(`  ⚠ erreurs de la page : ${erreurs.slice(0, 5).join(' | ')}`)
  if (apercus) {
    const dossier = join(RACINE, 'web', 'rapports', 'guide-apercus')
    rmSync(dossier, { recursive: true, force: true }); mkdirSync(dossier, { recursive: true })
    const pages = await page.$$('.pagedjs_page')
    for (const [i, p] of pages.entries()) await p.screenshot({ path: join(dossier, `page-${String(i + 1).padStart(2, '0')}.png`) })
    console.log(`  aperçus : ${pages.length} images dans web/rapports/guide-apercus/`)
  }
} finally {
  await navigateur.close()
  serveur.close()
}
