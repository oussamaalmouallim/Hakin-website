export type Disponibilite = 'disponible' | 'epuise' | 'a_confirmer'

export interface Coloris {
  nom: string
  hex: string
}

export interface TailleStock {
  taille: string
  disponible: boolean
}

export interface ImageProduit {
  /** Chemin sans suffixe : `/images/produits/<slug>/1` → fichiers `-480.webp` et `-960.webp` */
  src: string
  alt: string
  vue: 'face' | 'dos' | 'detail' | 'porte'
}

export interface Produit {
  slug: string
  nom: string
  marque: string
  categorie: string
  collections: string[]
  /** null tant que le prix n'est pas fixé : le produit affiche « Prix sur demande » et ne va pas au panier. */
  prixDH: number | null
  prixBarreDH: number | null
  /** Coloris visibles sur les photos ; disponibilité réelle à confirmer. */
  coloris: Coloris[]
  /** Vide tant que les tailles ne sont pas confirmées. */
  tailles: TailleStock[]
  disponibilite: Disponibilite
  description: string
  matiere: string | null
  entretien: string | null
  images: ImageProduit[]
  nouveau: boolean
  misEnAvant: boolean
  /** Champs encore à confirmer par la boutique (affichés « À confirmer », jamais inventés). */
  aConfirmer: string[]
}

export interface Categorie {
  slug: string
  nom: string
  accroche: string
  actif: boolean
  image: string | null
}

export interface Collection {
  slug: string
  nom: string
  accroche: string
  recit: string
  image: string
}

export interface Boutique {
  nom: string
  whatsapp: string
  whatsappAffiche: string
  instagram: { url: string; pseudo: string }
  facebook: { url: string; nom: string }
  ville: string
  adresse: string | null
  horaires: string | null
  paiement: string
  livraison: { zones: string | null; fraisDH: number | null; delai: string | null }
  retours: string | null
}

export interface LignePanier {
  cle: string
  slug: string
  coloris: string
  taille: string
  quantite: number
}

export interface CommandeEnvoyee {
  reference: string
  date: string
  lignes: (LignePanier & { nom: string; prixDH: number })[]
  sousTotalDH: number
  client: CoordonneesClient
}

export interface CoordonneesClient {
  nom: string
  telephone: string
  email: string
  ville: string
  adresse: string
  instructions: string
}
