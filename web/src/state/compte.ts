import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CommandeEnvoyee } from '@/lib/types'

/** Compte affiché par le site. Visiteur : gardé dans ce navigateur. Connecté : miroir du compte Supabase,
 *  chargé et enregistré par `state/synchroCompte.ts` (ADR 0005). */
export interface Adresse { id: string; libelle: string; ville: string; adresse: string; instructions: string; parDefaut: boolean }

interface EtatCompte {
  profil: { nom: string; telephone: string; email: string }
  adresses: Adresse[]
  commandes: CommandeEnvoyee[]
  /** Compte Supabase dont ces données sont le miroir (`null` = visiteur, données locales). */
  proprietaire: string | null
  majProfil: (p: Partial<EtatCompte['profil']>) => void
  enregistrerAdresse: (a: Omit<Adresse, 'id'> & { id?: string }) => void
  supprimerAdresse: (id: string) => void
  ajouterCommande: (c: CommandeEnvoyee) => void
  toutEffacer: () => void
}

const VIDE = { profil: { nom: '', telephone: '', email: '' }, adresses: [] as Adresse[], commandes: [] as CommandeEnvoyee[], proprietaire: null as string | null }

export const useCompte = create<EtatCompte>()(persist(set => ({
  ...VIDE,
  majProfil: p => set(s => ({ profil: { ...s.profil, ...p } })),
  enregistrerAdresse: a => set(s => {
    const id = a.id ?? crypto.randomUUID()
    let adresses = s.adresses.some(x => x.id === id) ? s.adresses.map(x => x.id === id ? { ...a, id } : x) : [...s.adresses, { ...a, id }]
    if (a.parDefaut || adresses.length === 1) adresses = adresses.map(x => ({ ...x, parDefaut: x.id === id }))
    return { adresses }
  }),
  supprimerAdresse: id => set(s => {
    const reste = s.adresses.filter(x => x.id !== id)
    if (reste.length && !reste.some(x => x.parDefaut)) reste[0] = { ...reste[0], parDefaut: true }
    return { adresses: reste }
  }),
  ajouterCommande: c => set(s => ({ commandes: [c, ...s.commandes] })),
  toutEffacer: () => set({ ...VIDE }),
}), { name: 'hmode-compte', version: 1 }))
