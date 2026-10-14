import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EtatFavoris { slugs: string[]; basculer: (slug: string) => void; retirer: (slug: string) => void }
export const useFavoris = create<EtatFavoris>()(persist(set => ({
  slugs: [],
  basculer: slug => set(s => ({ slugs: s.slugs.includes(slug) ? s.slugs.filter(x => x !== slug) : [...s.slugs, slug] })),
  retirer: slug => set(s => ({ slugs: s.slugs.filter(x => x !== slug) })),
}), { name: 'hmode-favoris', version: 1 }))
