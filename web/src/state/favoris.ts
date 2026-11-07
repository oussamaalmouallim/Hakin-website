import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EtatFavoris {
  slugs: string[]
  /** Compte auquel ces favoris appartiennent (null = visiteur) : un visiteur se fusionne une fois à la connexion. */
  proprietaire: string | null
  basculer: (slug: string) => void
  retirer: (slug: string) => void
  remplacer: (slugs: string[], proprietaire: string | null) => void
}
export const useFavoris = create<EtatFavoris>()(persist(set => ({
  slugs: [],
  proprietaire: null,
  basculer: slug => set(s => ({ slugs: s.slugs.includes(slug) ? s.slugs.filter(x => x !== slug) : [...s.slugs, slug] })),
  retirer: slug => set(s => ({ slugs: s.slugs.filter(x => x !== slug) })),
  remplacer: (slugs, proprietaire) => set({ slugs, proprietaire }),
}), { name: 'hmode-favoris', version: 1 }))

/** Favoris du compte d'abord, puis ceux du visiteur qui n'y sont pas ; pièces disparues du catalogue écartées. */
export function fusionnerFavoris(compte: string[], visiteur: string[], existe: (slug: string) => boolean) {
  return [...new Set([...compte, ...visiteur])].filter(existe)
}
