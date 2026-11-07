import type { Boutique, Produit } from './types'

/** Ligne de la table `produits` (supabase/lot-20-admin.sql) : mêmes champs que `produits.json`, en snake_case,
 *  plus `publie` (visible sur le site) et `ordre` (rang dans la boutique). */
export interface LigneProduit {
  slug: string
  genre: Produit['genre'] | null
  nom: string
  marque: string
  categorie: string
  collections: string[]
  prix_dh: number | null
  prix_barre_dh: number | null
  coloris: Produit['coloris']
  tailles: Produit['tailles']
  disponibilite: Produit['disponibilite']
  description: string
  matiere: string | null
  entretien: string | null
  images: Produit['images']
  nouveau: boolean
  mis_en_avant: boolean
  a_confirmer: string[]
  publie: boolean
  ordre: number
}

export type ProduitAdmin = Produit & { publie: boolean; ordre: number }

export function ligneVersProduit(l: LigneProduit): ProduitAdmin {
  return {
    slug: l.slug, ...(l.genre ? { genre: l.genre } : {}), nom: l.nom, marque: l.marque, categorie: l.categorie,
    collections: l.collections ?? [], prixDH: l.prix_dh, prixBarreDH: l.prix_barre_dh, coloris: l.coloris ?? [], tailles: l.tailles ?? [],
    disponibilite: l.disponibilite, description: l.description ?? '', matiere: l.matiere, entretien: l.entretien, images: l.images ?? [],
    nouveau: l.nouveau, misEnAvant: l.mis_en_avant, aConfirmer: l.a_confirmer ?? [], publie: l.publie, ordre: l.ordre,
  }
}

export function produitVersLigne(p: Produit, extra: { publie?: boolean; ordre?: number } = {}): LigneProduit {
  return {
    slug: p.slug, genre: p.genre ?? null, nom: p.nom, marque: p.marque, categorie: p.categorie, collections: p.collections,
    prix_dh: p.prixDH, prix_barre_dh: p.prixBarreDH, coloris: p.coloris, tailles: p.tailles, disponibilite: p.disponibilite,
    description: p.description, matiere: p.matiere, entretien: p.entretien, images: p.images, nouveau: p.nouveau,
    mis_en_avant: p.misEnAvant, a_confirmer: p.aConfirmer, publie: extra.publie ?? true, ordre: extra.ordre ?? 0,
  }
}

/** Textes des pages d'information, saisis dans l'administration. Vide = « À confirmer » sur le site. */
export interface Textes {
  'mentions-legales': Record<string, string>
  cgv: Record<string, string>
  confidentialiteResponsable: string
  guideDesTailles: string
}

export const SECTIONS_TEXTES = {
  'mentions-legales': ['Éditeur du site', 'Raison sociale et immatriculation', 'Hébergeur', 'Propriété intellectuelle'],
  cgv: ['Objet', 'Prix', 'Commande', 'Paiement', 'Livraison', 'Échanges et retours', 'Litiges'],
} as const

export const TEXTES_VIDES: Textes = { 'mentions-legales': {}, cgv: {}, confidentialiteResponsable: '', guideDesTailles: '' }

/** Complète des réglages lus en base avec les valeurs par défaut (champ absent = valeur du fichier). */
export function fusionnerBoutique(defaut: Boutique, base: Partial<Boutique> | null | undefined): Boutique {
  if (!base) return defaut
  return {
    ...defaut, ...base,
    instagram: { ...defaut.instagram, ...base.instagram },
    facebook: { ...defaut.facebook, ...base.facebook },
    livraison: { ...defaut.livraison, ...base.livraison },
    paiement: defaut.paiement, // D3 : paiement à la livraison, non modifiable
  }
}
export function fusionnerTextes(base: Partial<Textes> | null | undefined): Textes {
  return {
    'mentions-legales': { ...base?.['mentions-legales'] }, cgv: { ...base?.cgv },
    confidentialiteResponsable: base?.confidentialiteResponsable ?? '', guideDesTailles: base?.guideDesTailles ?? '',
  }
}
