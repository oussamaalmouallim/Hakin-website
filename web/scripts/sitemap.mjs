// Après le build : dist/sitemap.xml (pages publiques, types, collections, fiches produit) + ligne « Sitemap: » dans robots.txt.
// Adresse du site : SITE_URL (nom de domaine final) ou, sur Netlify, URL (adresse du déploiement). Sans adresse : rien n'est
// généré (une sitemap exige des adresses complètes), le build continue.
// Les pièces viennent de src/data/produits.json ; celles créées dans l'admin seulement apparaîtront au build suivant.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const base = (process.env.SITE_URL || process.env.URL || '').trim().replace(/\/+$/, '')
if (!base) { console.log('sitemap : SITE_URL absente, sitemap.xml non générée.'); process.exit(0) }
if (!/^https?:\/\/[^\s/]+$/.test(base)) { console.error(`sitemap : SITE_URL invalide (${base}).`); process.exit(1) }
if (!existsSync('dist/index.html')) { console.error('sitemap : lancer après vite build (dist/ absent).'); process.exit(1) }

const lire = f => JSON.parse(readFileSync(`src/data/${f}`, 'utf8'))
const PAGES = ['/', '/boutique', '/collections', '/maison', '/contact', '/livraison-retours', '/faq', '/guide-des-tailles', '/mentions-legales', '/confidentialite', '/cgv']
const urls = [
  ...PAGES.map(p => ({ p, priorite: p === '/' ? '1.0' : p === '/boutique' ? '0.9' : '0.5' })),
  ...lire('categories.json').filter(c => c.actif !== false).map(c => ({ p: `/boutique/${c.slug}`, priorite: '0.8' })),
  ...lire('collections.json').map(c => ({ p: `/collections/${c.slug}`, priorite: '0.6' })),
  ...lire('produits.json').map(p => ({ p: `/produit/${p.slug}`, priorite: '0.7' })),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${encodeURI(u.p)}</loc><priority>${u.priorite}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync('dist/sitemap.xml', xml)
const robots = readFileSync('dist/robots.txt', 'utf8').replace(/\nSitemap:.*$/m, '')
writeFileSync('dist/robots.txt', `${robots.trimEnd()}\nSitemap: ${base}/sitemap.xml\n`)
console.log(`sitemap : ${urls.length} adresses (${base}).`)
