import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trouverProduit } from '@/lib/catalogue'
import type { LignePanier } from '@/lib/types'

export const QTE_MIN = 1
export const QTE_MAX = 10
const borner = (q: number) => Math.min(QTE_MAX, Math.max(QTE_MIN, Math.round(q)))
export const cleLigne = (slug: string, coloris: string, taille: string) => `${slug}|${coloris}|${taille}`

interface EtatPanier {
  lignes: LignePanier[]
  ajouter: (slug: string, coloris: string, taille: string, quantite?: number) => void
  changerQuantite: (cle: string, quantite: number) => void
  retirer: (cle: string) => LignePanier | undefined
  restaurer: (ligne: LignePanier) => void
  vider: () => void
}

export const usePanier = create<EtatPanier>()(persist((set, get) => ({
  lignes: [],
  ajouter: (slug, coloris, taille, quantite = 1) => set(s => {
    const cle = cleLigne(slug, coloris, taille)
    const existe = s.lignes.find(l => l.cle === cle)
    return existe
      ? { lignes: s.lignes.map(l => l.cle === cle ? { ...l, quantite: borner(l.quantite + quantite) } : l) }
      : { lignes: [...s.lignes, { cle, slug, coloris, taille, quantite: borner(quantite) }] }
  }),
  changerQuantite: (cle, quantite) => set(s => ({ lignes: s.lignes.map(l => l.cle === cle ? { ...l, quantite: borner(quantite) } : l) })),
  retirer: cle => { const l = get().lignes.find(x => x.cle === cle); set(s => ({ lignes: s.lignes.filter(x => x.cle !== cle) })); return l },
  restaurer: ligne => set(s => s.lignes.some(l => l.cle === ligne.cle) ? s : { lignes: [...s.lignes, ligne] }),
  vider: () => set({ lignes: [] }),
}), { name: 'hmode-panier', version: 1 }))

/** Lignes enrichies (produit + prix). Une ligne dont le produit n'existe plus ou n'a pas de prix est ignorée. */
export function lignesDetaillees(lignes: LignePanier[]) {
  return lignes.flatMap(l => {
    const p = trouverProduit(l.slug)
    return p && p.prixDH !== null ? [{ ...l, produit: p, prixDH: p.prixDH, totalDH: p.prixDH * l.quantite }] : []
  })
}
export const sousTotal = (lignes: LignePanier[]) => lignesDetaillees(lignes).reduce((s, l) => s + l.totalDH, 0)
export const nbArticles = (lignes: LignePanier[]) => lignes.reduce((s, l) => s + l.quantite, 0)
