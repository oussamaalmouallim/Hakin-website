import { create } from 'zustand'
import { signalerErreur } from '@/lib/supervision'
import { obtenirSupabase } from '@/lib/supabase'
import { appliquerCatalogue, appliquerReglages } from '@/lib/catalogue'
import { ligneVersProduit, type LigneProduit, type Textes } from '@/lib/produitsBase'
import type { ReglagesBoutique, Produit } from '@/lib/types'

/** Origine des données affichées : fichiers livrés avec le site, dernière copie de la base gardée sur l'appareil, ou la base. */
export type SourceDonnees = 'fichier' | 'copie' | 'base'
interface EtatDonnees { version: number; source: SourceDonnees }
/** `version` change à chaque nouveau catalogue appliqué : l'appli s'en sert pour réafficher les pages. */
export const useDonnees = create<EtatDonnees>(() => ({ version: 0, source: 'fichier' }))

const CLE_COPIE = 'hmode-catalogue'
interface Copie { v: 1; produits: Produit[]; boutique: ReglagesBoutique | null; textes: Partial<Textes> | null }

function appliquer(c: Omit<Copie, 'v'>, source: SourceDonnees) {
  if (c.produits.length) appliquerCatalogue(c.produits)
  appliquerReglages(c.boutique, c.textes)
  useDonnees.setState(s => ({ version: s.version + 1, source }))
}

/** Au démarrage : reprend la dernière copie de la base (affichage immédiat), puis lit la base.
 *  Base vide ou injoignable : on garde ce qu'on a (fichiers ou copie). Jamais d'écran vide. */
export async function chargerDonnees() {
  try {
    const brut = localStorage.getItem(CLE_COPIE)
    const copie = brut ? JSON.parse(brut) as Copie : null
    if (copie?.v === 1 && Array.isArray(copie.produits)) appliquer(copie, 'copie')
  } catch { /* copie illisible : ignorée */ }

  const sb = await obtenirSupabase()
  if (!sb) return
  try {
    const [rProduits, rReglages] = await Promise.all([
      sb.from('produits').select('*').eq('publie', true).order('ordre').order('nom'),
      sb.from('reglages').select('cle, valeur'),
    ])
    if (rProduits.error || rReglages.error) throw rProduits.error ?? rReglages.error
    const produits = ((rProduits.data ?? []) as LigneProduit[]).map(l => {
      const { publie: _p, ordre: _o, ...p } = ligneVersProduit(l)
      return p as Produit
    })
    const reglages = Object.fromEntries(((rReglages.data ?? []) as { cle: string; valeur: unknown }[]).map(r => [r.cle, r.valeur]))
    const c = { produits, boutique: (reglages.boutique ?? null) as ReglagesBoutique | null, textes: (reglages.textes ?? null) as Partial<Textes> | null }
    appliquer(c, 'base')
    try { localStorage.setItem(CLE_COPIE, JSON.stringify({ v: 1, ...c })) } catch { /* stockage plein ou bloqué */ }
  } catch (e) {
    console.warn('[catalogue] base injoignable, données locales gardées :', e)
    signalerErreur('api', `Catalogue : base injoignable (${String((e as Error)?.message ?? e)})`, { gravite: 'avertissement' })
  }
}
