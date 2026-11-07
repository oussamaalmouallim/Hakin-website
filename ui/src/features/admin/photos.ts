/** Préparation d'une photo dans le navigateur, avant envoi : deux largeurs WebP (480 et 960 px), comme `npm run images`. */
export const TAILLE_MAX_PHOTO = 15 * 1024 * 1024
export const LARGEURS = [480, 960] as const

export function controlerPhoto(f: File): string | null {
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/.test(f.type)) return `« ${f.name} » n'est pas une photo (JPEG, PNG, WebP).`
  if (f.size > TAILLE_MAX_PHOTO) return `« ${f.name} » dépasse 15 Mo.`
  return null
}

/** Largeur cible sans jamais agrandir : une photo de 600 px donne 480 et 600. */
export const largeurCible = (origine: number, cible: number) => Math.min(origine, cible)

export async function preparerPhoto(f: File): Promise<{ 480: Blob; 960: Blob }> {
  const image = await createImageBitmap(f)
  const sortie = {} as { 480: Blob; 960: Blob }
  for (const l of LARGEURS) {
    const largeur = largeurCible(image.width, l)
    const hauteur = Math.round(image.height * (largeur / image.width))
    const toile = document.createElement('canvas')
    toile.width = largeur; toile.height = hauteur
    const ctx = toile.getContext('2d')
    if (!ctx) throw new Error('Préparation de la photo impossible dans ce navigateur.')
    ctx.drawImage(image, 0, 0, largeur, hauteur)
    sortie[l] = await new Promise<Blob>((ok, ko) => toile.toBlob(b => (b ? ok(b) : ko(new Error('Conversion WebP impossible dans ce navigateur.'))), 'image/webp', 0.82))
    if (sortie[l].type !== 'image/webp') throw new Error('Ce navigateur ne sait pas produire du WebP : utilisez Chrome, Edge ou Firefox récent.')
  }
  image.close()
  return sortie
}
