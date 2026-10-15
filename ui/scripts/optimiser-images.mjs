// Génère les images publiées (WebP) à partir du dossier unique ui/medias/. Relançable : écrase les sorties.
// Usage : npm run images   (voir ui/medias/LISEZMOI.md)
import sharp from 'sharp'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ici = dirname(fileURLToPath(import.meta.url))
const medias = join(ici, '..', 'medias')
const sortie = join(ici, '..', 'public', 'images')
const LARGEURS = [480, 960]
const IMAGE = /^(\d+)\.(jpe?g|png|webp|avif)$/i
// Packshots (objet seul sur fond uni) : fond ramené au blanc pur, puis détouré ; le site le fond dans le sable du cadre.
const produits = JSON.parse(await readFile(join(ici, '..', 'src', 'data', 'produits.json'), 'utf8'))
const PACKSHOTS = new Set(produits.filter(p => p.categorie === 'sneakers').map(p => p.slug))

/** Couleur du fond si les 4 coins et le haut sont identiques et clairs, sinon null. */
async function fondUni(fichier) {
  const { data } = await sharp(fichier).resize(50, 50, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = (x, y) => [...data.subarray((y * 50 + x) * 3, (y * 50 + x) * 3 + 3)]
  const points = [px(0, 0), px(49, 0), px(0, 49), px(49, 49), px(25, 0)]
  const uni = points.every(c => c.every((v, i) => Math.abs(v - points[0][i]) <= 3 && v >= 215))
  return uni ? points[0] : null
}

// Produits : medias/produits/<slug>/<n>.<ext>  ->  public/images/produits/<slug>/<n>-<largeur>.webp
let total = 0
for (const slug of (await readdir(join(medias, 'produits'), { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name)) {
  const fichiers = (await readdir(join(medias, 'produits', slug))).filter(f => IMAGE.test(f))
  await mkdir(join(sortie, 'produits', slug), { recursive: true })
  for (const f of fichiers) {
    const n = f.slice(0, -extname(f).length)
    // Retire les bandes blanches ajoutées par certains sites (photo portrait collée dans un carré blanc).
    const chemin = join(medias, 'produits', slug, f)
    const fond = PACKSHOTS.has(slug) ? await fondUni(chemin) : null
    const base = fond
      ? await sharp(chemin).rotate().linear(fond.map(c => 255 / c), [0, 0, 0]).toBuffer()
      : await sharp(chemin).rotate().toBuffer()
    const source = await sharp(base).trim({ background: '#ffffff', threshold: 12 }).toBuffer().catch(() => base)
    for (const l of LARGEURS) {
      await sharp(source).resize({ width: l, withoutEnlargement: true }).webp({ quality: 82 })
        .toFile(join(sortie, 'produits', slug, `${n}-${l}.webp`))
    }
    total++
  }
}
console.log(`${total} images produit générées`)

// Campagne : cadrages définis dans medias/campagne/cadrages.json (image source, zone, largeurs produites)
await mkdir(join(sortie, 'campagne'), { recursive: true })
for (const c of JSON.parse(await readFile(join(medias, 'campagne', 'cadrages.json'), 'utf8'))) {
  for (const l of c.largeurs ?? [640]) {
    const info = await sharp(join(medias, 'campagne', c.source ?? 'hero.png')).extract(c.rect).resize({ width: l, withoutEnlargement: true })
      .webp({ quality: 84 }).toFile(join(sortie, 'campagne', `${c.nom}-${l}.webp`))
    console.log(`campagne/${c.nom}-${l}.webp  ${info.width}x${info.height}`)
  }
}
