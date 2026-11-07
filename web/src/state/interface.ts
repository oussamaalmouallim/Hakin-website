import { create } from 'zustand'

type Panneau = 'panier' | 'recherche' | 'menu' | null
interface EtatInterface { panneau: Panneau; ouvrir: (p: Exclude<Panneau, null>) => void; fermer: () => void }
export const useInterface = create<EtatInterface>(set => ({
  panneau: null,
  ouvrir: panneau => set({ panneau }),
  fermer: () => set({ panneau: null }),
}))
