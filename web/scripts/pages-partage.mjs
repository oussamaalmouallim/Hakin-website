// Aperçus des liens partagés (WhatsApp, Facebook, Instagram en message) : lancé après `vite build`.
// Les robots de ces plateformes ne lisent pas le JavaScript : ils lisent les balises <meta property="og:…"> du HTML reçu.
// Ce script écrit donc, pour chaque pièce publiée, une page dist/produit/<slug>/index.html (le même site, avec son titre,
// sa description et son image) et une image JPEG 1200×630 de moins de 300 Ko dans dist/partage/.
// Catalogue : lu dans Supabase (pièces publiées) si les variables publiques sont là, sinon src/data/produits.json.
// Sans adresse du site (SITE_URL, ou URL fournie par Netlify), rien n'est fait : une image d'aperçu doit être absolue.
// Une pièce modifiée dans l'admin n'a son nouvel aperçu qu'au build suivant (le robot « Surveillance » peut le relancer).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(racine, 'dist')
const site = (process.env.SITE_URL || process.env.URL || '').replace(/\/+$/, '')
if (!site) { console.log('partage : SITE_URL absente, aperçus non générés.'); process.exit(0) }

const FOND = { r: 0xf5, g: 0xf4, b: 0xf0 } // --fond de palette.md
const W = 1200, H = 630
const echapper = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dh = n => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DH`
const boutique = JSON.parse(await readFile(join(racine, 'src/data/boutique.json'), 'utf8'))

async function catalogue() {
  const url = process.env.VITE_SUPABASE_URL, cle = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (url && cle) {
    try {
      const r = await fetch(`${url}/rest/v1/produits?select=slug,nom,marque,prix_dh,description,images&publie=eq.true&order=ordre`,
        { headers: { apikey: cle, Authorization: `Bearer ${cle}` }, signal: AbortSignal.timeout(20000) })
      if (r.ok) {
        const lignes = await r.json()
        if (lignes.length) return { source: 'base', produits: lignes.map(l => ({ slug: l.slug, nom: l.nom, marque: l.marque, prixDH: l.prix_dh, description: l.description, images: l.images ?? [] })) }
      }
    } catch { /* base injoignable : fichiers du site */ }
  }
  return { source: 'fichiers', produits: JSON.parse(await readFile(join(racine, 'src/data/produits.json'), 'utf8')) }
}

/** Image source d'une pièce : photo téléversée (adresse complète) ou photo du site (public/images/…-960.webp). */
async function lireImage(src) {
  if (!src) return null
  if (/^https?:\/\//.test(src)) {
    try { const r = await fetch(src, { signal: AbortSignal.timeout(20000) }); return r.ok ? Buffer.from(await r.arrayBuffer()) : null } catch { return null }
  }
  const fichier = join(racine, 'public', `${src.replace(/^\//, '')}-960.webp`)
  return existsSync(fichier) ? readFile(fichier) : null
}

let monogramme = null
const cheminLogo = join(racine, 'medias/marque/logo-monogramme-2000.png')
if (existsSync(cheminLogo)) monogramme = await sharp(cheminLogo).resize(84, 84, { fit: 'contain', background: { ...FOND, alpha: 0 } }).png().toBuffer()

/** Pièce entière, posée sur le fond de la charte (jamais recadrée ni déformée), monogramme en bas à droite. */
async function imagePartage(source, sortie) {
  const piece = await sharp(source).resize(W - 160, H - 80, { fit: 'inside', withoutEnlargement: false }).toBuffer()
  const calques = [{ input: piece, gravity: 'center' }]
  if (monogramme) calques.push({ input: monogramme, top: H - 84 - 28, left: W - 84 - 32 })
  let qualite = 84, jpeg
  do {
    jpeg = await sharp({ create: { width: W, height: H, channels: 3, background: FOND } }).composite(calques).jpeg({ quality: qualite, mozjpeg: true }).toBuffer()
    qualite -= 8
  } while (jpeg.length > 290_000 && qualite > 40)
  await writeFile(sortie, jpeg)
}

/** Remplace le bloc <!-- partage:debut --> … <!-- partage:fin --> de index.html. */
function avecBalises(html, b) {
  const bloc = `<!-- partage:debut -->
    <title>${echapper(b.titre)}</title>
    <meta name="description" content="${echapper(b.description)}" />
    <link rel="canonical" href="${echapper(b.url)}" />
    <meta property="og:site_name" content="H MODE" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:type" content="${b.type}" />
    <meta property="og:title" content="${echapper(b.titre)}" />
    <meta property="og:description" content="${echapper(b.description)}" />
    <meta property="og:url" content="${echapper(b.url)}" />
    <meta property="og:image" content="${echapper(b.image)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="${W}" />
    <meta property="og:image:height" content="${H}" />
    <meta property="og:image:alt" content="${echapper(b.alt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- partage:fin -->`
  if (!/<!-- partage:debut -->[\s\S]*<!-- partage:fin -->/.test(html)) throw new Error('index.html : bloc partage introuvable')
  return html.replace(/<!-- partage:debut -->[\s\S]*<!-- partage:fin -->/, bloc)
}

const gabarit = await readFile(join(dist, 'index.html'), 'utf8')
await mkdir(join(dist, 'partage'), { recursive: true })
const accroche = `Vêtements premium à ${boutique.ville ?? 'Casablanca'}. Paiement à la livraison, commande confirmée sur WhatsApp.`

// Accueil (et toute page sans aperçu propre) : la scène du héros.
const heros = join(racine, 'public/images/campagne/hero-scene-1920.webp')
if (existsSync(heros)) {
  await writeFile(join(dist, 'partage/hmode.jpg'), await sharp(heros).resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer())
}
await writeFile(join(dist, 'index.html'), avecBalises(gabarit, {
  titre: 'H MODE — Boutique premium · Casablanca', description: accroche, url: `${site}/`, type: 'website',
  image: `${site}/partage/hmode.jpg`, alt: 'H MODE, boutique de vêtements à Casablanca',
}))

const { source, produits } = await catalogue()
let faits = 0, sansImage = 0
for (const p of produits) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) continue
  const image = await lireImage(p.images?.[0]?.src)
  const fichierImage = `partage/${p.slug}.jpg`
  if (image) await imagePartage(image, join(dist, fichierImage)); else sansImage++
  const prix = p.prixDH ? dh(p.prixDH) : 'Prix sur demande'
  const nom = p.marque ? `${p.marque} — ${p.nom}` : p.nom
  const description = [prix, (p.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 140), 'Paiement à la livraison.'].filter(Boolean).join(' · ')
  await mkdir(join(dist, 'produit', p.slug), { recursive: true })
  await writeFile(join(dist, 'produit', p.slug, 'index.html'), avecBalises(gabarit, {
    titre: `${nom} · H MODE`, description, url: `${site}/produit/${p.slug}`, type: 'product',
    image: `${site}/${image ? fichierImage : 'partage/hmode.jpg'}`, alt: nom,
  }))
  faits++
}
console.log(`partage : ${faits} fiches (catalogue : ${source})${sansImage ? `, ${sansImage} sans photo (image de la boutique)` : ''}, adresse ${site}.`)
