import type { SupabaseClient } from '@supabase/supabase-js'

/** Client Supabase unique (comptes, panier, commandes — ADR 0005), chargé à la demande pour ne pas alourdir le premier affichage.
 *  Sans variables d'environnement (tests, clone sans `.env`), le client vaut `null` : le site garde le fonctionnement local. */
const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabaseActif = Boolean(url && cle)

/** « Se souvenir de moi » : session gardée dans localStorage (oui) ou seulement le temps de l'onglet, sessionStorage (non). */
const CLE_SOUVENIR = 'hmode-souvenir'
export function memoriserSession(souvenir: boolean) {
  try { localStorage.setItem(CLE_SOUVENIR, souvenir ? '1' : '0') } catch { /* stockage indisponible : session par défaut */ }
}
const stockageSession = {
  getItem(k: string) {
    try { return localStorage.getItem(k) ?? sessionStorage.getItem(k) } catch { return null }
  },
  setItem(k: string, v: string) {
    try {
      const souvenir = localStorage.getItem(CLE_SOUVENIR) !== '0'
      ;(souvenir ? localStorage : sessionStorage).setItem(k, v)
      ;(souvenir ? sessionStorage : localStorage).removeItem(k)
    } catch { /* stockage indisponible */ }
  },
  removeItem(k: string) {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch { /* stockage indisponible */ }
  },
}

let client: Promise<SupabaseClient | null> | null = null
export function obtenirSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseActif) return Promise.resolve(null)
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, cle!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'hmode-session', storage: stockageSession } }))
  return client
}
