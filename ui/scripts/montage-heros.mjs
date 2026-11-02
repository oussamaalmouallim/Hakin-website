// Photomontage du héros : pose le personnage fourni sur la scène d'origine, à la place de l'ancien personnage.
// Même décor dans les deux photos : alignement par les lunettes et la pointe de la chaussure (échelle 1,80).
// Usage : node scripts/montage-heros.mjs medias/campagne/hero3-scene.jpg medias/campagne/hero4-personnage.jpeg medias/campagne/hero4-scene.jpg 1610 96 1081 14
//         (x, y, largeur du personnage dans la scène 2732 × 1536, flou du masque en px de la photo 600 × 800)
import sharp from 'sharp'
const [,, scene, perso, sortie, x, y, l, flou] = process.argv
const L = +l, H = Math.round(L * 800 / 600), k = L / 600
// Silhouette du personnage dans la photo fournie (repère 600 × 800), marge comprise
const pts = [[190,25],[425,25],[445,225],[525,295],[598,375],[600,480],[575,700],[575,800],[90,800],[18,610],[18,415],[75,285],[175,235],[180,140]]
const poly = pts.map(([a,b]) => `${(a*k).toFixed(1)},${(b*k).toFixed(1)}`).join(' ')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}"><polygon points="${poly}" fill="#fff" filter="url(#b)"/><defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${+flou*k}"/></filter></defs></svg>`
const masque = await sharp(Buffer.from(svg)).resize(L, H).png().toBuffer()
const p = await sharp(await sharp(perso).resize(L, H).ensureAlpha().png().toBuffer()).composite([{ input: masque, blend: 'dest-in' }]).png().toBuffer()
await sharp(scene).composite([{ input: p, left: +x, top: +y }]).jpeg({ quality: 92 }).toFile(sortie)
console.log('ok')
