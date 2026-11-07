// Logo de la marque = le monogramme du héros (composant `Monogramme`, design-system/Marque.tsx), décision du 07/11.
// Rend ce monogramme en PNG, dans la police de la marque et les couleurs de tokens.css, pour :
//   - les photos de profil Instagram et Facebook (carré 1080, fond crème, logo dans le cercle de recadrage) ;
//   - le logo seul sur fond transparent (2000 px) ;
//   - l'icône du site (favicon 48 px, icône d'écran d'accueil iOS 180 px).
// Usage : cd web && npm run logo   (Chromium de Playwright, rien n'est envoyé sur le réseau)
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const token = nom => {
  const m = tokens.match(new RegExp(`--${nom}:\\s*([^;]+);`))
  if (!m) throw new Error(`token --${nom} absent de tokens.css`)
  return m[1].trim()
}
const police = readFileSync('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2').toString('base64')

// Même dessin que <Monogramme> : « H » Cormorant 500 traversé d'une courbe, dégradé beige.
const monogramme = `
  <defs><linearGradient id="d" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="${token('beige-moyen')}"/><stop offset="0.55" stop-color="${token('beige-fonce')}"/><stop offset="1" stop-color="${token('beige-tres-fonce')}"/>
  </linearGradient></defs>
  <g id="logo">
    <text x="60" y="84" text-anchor="middle" font-family="Marque" font-size="104" font-weight="500" fill="url(#d)">H</text>
    <path d="M14 66 C 40 58, 62 40, 106 34 C 76 42, 52 58, 22 70 Z" fill="url(#d)"/>
  </g>`

/** `remplissage` = part du côté occupée par le logo ; `fond` = couleur ou null (transparent). */
async function rendre(page, { taille, remplissage, fond, sortie }) {
  await page.setViewportSize({ width: taille, height: taille })
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Marque; src: url(data:font/woff2;base64,${police}) format('woff2'); font-weight: 500; }
    html, body { margin: 0; background: ${fond ?? 'transparent'}; }
    svg { display: block; width: 100vw; height: 100vh; }
  </style></head><body><svg xmlns="http://www.w3.org/2000/svg">${monogramme}</svg></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  // Cadre calé sur le dessin réel (lettre + courbe), centré, avec la marge voulue.
  await page.evaluate(r => {
    const svg = document.querySelector('svg'), b = document.getElementById('logo').getBBox()
    const cote = Math.max(b.width, b.height) / r
    svg.setAttribute('viewBox', `${b.x + b.width / 2 - cote / 2} ${b.y + b.height / 2 - cote / 2} ${cote} ${cote}`)
  }, remplissage)
  await page.screenshot({ path: sortie, omitBackground: !fond })
  console.log(`✓ ${sortie} (${taille} px)`)
}

mkdirSync('medias/marque', { recursive: true })
const navigateur = await chromium.launch()
const page = await navigateur.newPage()
try {
  // Instagram et Facebook recadrent la photo de profil en cercle : logo calé pour rester dans le cercle.
  await rendre(page, { taille: 1080, remplissage: 0.8, fond: token('fond'), sortie: 'medias/marque/logo-profil-1080.png' })
  await rendre(page, { taille: 2000, remplissage: 0.9, fond: null, sortie: 'medias/marque/logo-monogramme-2000.png' })
  await rendre(page, { taille: 48, remplissage: 1.15, fond: token('fond'), sortie: 'public/favicon.png' })
  await rendre(page, { taille: 180, remplissage: 0.9, fond: token('fond'), sortie: 'public/apple-touch-icon.png' })
} finally {
  await navigateur.close()
}
