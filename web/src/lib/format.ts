/** Format déterministe (indépendant de l'ICU du navigateur) : « 1 250 DH » avec espaces insécables. */
export const formatDH = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DH`

export const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Téléphone marocain : +212 / 00212 / 0, puis 5, 6 ou 7, puis 8 chiffres. */
export function telephoneMarocValide(t: string) {
  const n = t.replace(/[\s.-]/g, '')
  return /^(?:\+212|00212|0)[5-7]\d{8}$/.test(n)
}

export const genererReference = (d = new Date()) =>
  `HM-${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
