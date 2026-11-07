// Audit Lighthouse sur la version de production (pas le serveur de dev, dont les scores ne veulent rien dire).
// Build dans un dossier temporaire (web/dist n'est pas touché), aperçu sur 6014, audit mobile et ordinateur,
// rapports HTML dans web/rapports/lighthouse/, puis arrêt de l'aperçu. Le 6013 n'est pas touché.
// Usage : npm run qualite:lighthouse
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'
import { chromium } from '@playwright/test'

const PORT = 6014
const BASE = `http://localhost:${PORT}`
const PAGES = ['/', '/boutique', '/produit/t-shirt-prada-graffiti', '/commande', '/connexion']
const SORTIE = 'rapports/lighthouse'
const BUILD = join(tmpdir(), 'hmode-lighthouse')

console.log('Build de production…')
execFileSync('npx', ['vite', 'build', '--outDir', BUILD, '--emptyOutDir'], { stdio: 'ignore' })

const apercu = spawn('npx', ['vite', 'preview', '--outDir', BUILD, '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const arreter = () => { try { apercu.kill() } catch { /* déjà arrêté */ } }
process.on('exit', arreter)

for (let i = 0; i < 60; i++) {
  try { if ((await fetch(BASE)).ok) break } catch { /* pas encore prêt */ }
  await new Promise(r => setTimeout(r, 250))
}

mkdirSync(SORTIE, { recursive: true })
const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new'] })
const lignes = []
try {
  for (const [appareil, config] of [['mobile', undefined], ['ordinateur', desktopConfig]]) {
    for (const page of PAGES) {
      const r = await lighthouse(`${BASE}${page}`, { port: chrome.port, output: 'html', logLevel: 'error' }, config)
      const c = r.lhr.categories
      const note = k => Math.round((c[k]?.score ?? 0) * 100)
      const nom = `${appareil}${page.replace(/\W+/g, '-').replace(/-$/, '') || '-accueil'}`
      writeFileSync(join(SORTIE, `${nom}.html`), r.report)
      lignes.push({ appareil, page, performance: note('performance'), accessibilite: note('accessibility'), bonnesPratiques: note('best-practices'), seo: note('seo'),
        lcp: r.lhr.audits['largest-contentful-paint']?.displayValue, cls: r.lhr.audits['cumulative-layout-shift']?.displayValue })
    }
  }
} finally {
  await chrome.kill()
  arreter()
}
console.table(lignes)
writeFileSync(join(SORTIE, 'resume.json'), JSON.stringify(lignes, null, 2))
console.log(`Rapports : web/${SORTIE}/`)
