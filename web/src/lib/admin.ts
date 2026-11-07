import type { ProduitAdmin } from './produitsBase'
import type { Produit } from './types'

/** Logique pure de l'administration (testée dans src/test/admin.test.ts). */

/** « T-shirt Été Dior » → « t-shirt-ete-dior » : minuscules, sans accents, tirets. */
export function slugifier(texte: string) {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
}

/** Pendant la frappe : même nettoyage, mais le tiret final reste (sinon « polo-riviera » ne peut pas s'écrire). */
export function slugEnSaisie(texte: string) {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 120)
}

export const CHAMPS_A_CONFIRMER = ['prix', 'tailles', 'disponibilité des coloris', 'matière', 'entretien'] as const
export const TAILLES_VETEMENTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const TAILLES_CHAUSSURES = ['39', '40', '41', '42', '43', '44', '45']

export type ErreursProduit = Partial<Record<'nom' | 'slug' | 'categorie' | 'prixDH' | 'prixBarreDH' | 'tailles' | 'coloris' | 'images', string>>

/** Contrôles avant enregistrement (la base refait les siens : contraintes de la table `produits`). */
export function validerProduit(p: ProduitAdmin, slugsExistants: string[] = []): ErreursProduit {
  const e: ErreursProduit = {}
  if (!p.nom.trim()) e.nom = 'Indiquez le nom de la pièce.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) e.slug = 'Adresse invalide : lettres minuscules, chiffres et tirets.'
  else if (slugsExistants.includes(p.slug)) e.slug = 'Cette adresse est déjà prise par une autre pièce.'
  if (!p.categorie) e.categorie = 'Choisissez un type.'
  if (p.prixDH !== null && (!Number.isInteger(p.prixDH) || p.prixDH < 1 || p.prixDH > 1_000_000)) e.prixDH = 'Prix en dirhams, nombre entier entre 1 et 1 000 000.'
  if (p.prixBarreDH !== null) {
    if (p.prixDH === null) e.prixBarreDH = 'Indiquez d\'abord le prix de vente.'
    else if (!Number.isInteger(p.prixBarreDH) || p.prixBarreDH <= p.prixDH) e.prixBarreDH = 'L\'ancien prix doit être plus élevé que le prix de vente.'
  }
  const tailles = p.tailles.map(t => t.taille.trim())
  if (tailles.some(t => !t)) e.tailles = 'Une taille est vide.'
  else if (new Set(tailles).size !== tailles.length) e.tailles = 'Une taille apparaît deux fois.'
  if (p.coloris.some(c => !c.nom.trim() || !/^#[0-9a-f]{6}$/i.test(c.hex))) e.coloris = 'Chaque coloris a un nom et une teinte.'
  else if (new Set(p.coloris.map(c => c.nom.trim().toLowerCase())).size !== p.coloris.length) e.coloris = 'Un coloris apparaît deux fois.'
  if (p.images.some(i => !i.alt.trim())) e.images = 'Décrivez chaque photo (texte pour les lecteurs d\'écran).'
  if (p.publie && !p.images.length) e.images = 'Une pièce visible sur le site a besoin d\'au moins une photo.'
  return e
}

/** Les champs « À confirmer » suivent les données : un prix saisi retire « prix », des tailles retirent « tailles ». */
export function nettoyerAConfirmer(p: Pick<Produit, 'aConfirmer' | 'prixDH' | 'tailles' | 'matiere' | 'entretien'>) {
  return p.aConfirmer.filter(c => !(
    (c === 'prix' && p.prixDH !== null) || (c === 'tailles' && p.tailles.length > 0)
    || (c === 'matière' && p.matiere) || (c === 'entretien' && p.entretien)))
}

export function produitVide(categorie = ''): ProduitAdmin {
  return {
    slug: '', genre: 'homme', nom: '', marque: '', categorie, collections: [], prixDH: null, prixBarreDH: null, coloris: [], tailles: [],
    disponibilite: 'a_confirmer', description: '', matiere: null, entretien: null, images: [], nouveau: false, misEnAvant: false,
    aConfirmer: ['prix', 'tailles'], publie: false, ordre: 0,
  }
}

export type FiltreProduits = 'tous' | 'sans-prix' | 'masques' | 'soldes' | 'femmes'
export const FILTRES_PRODUITS: { cle: FiltreProduits; libelle: string }[] = [
  { cle: 'tous', libelle: 'Tous' }, { cle: 'sans-prix', libelle: 'Sans prix' }, { cle: 'masques', libelle: 'Masqués' },
  { cle: 'soldes', libelle: 'En solde' }, { cle: 'femmes', libelle: 'Femmes' },
]
const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export function filtrerProduitsAdmin(liste: ProduitAdmin[], q: string, filtre: FiltreProduits) {
  const m = sansAccents(q.trim())
  return liste.filter(p => {
    if (filtre === 'sans-prix' && p.prixDH !== null) return false
    if (filtre === 'masques' && p.publie) return false
    if (filtre === 'soldes' && !(p.prixBarreDH !== null && p.prixDH !== null && p.prixBarreDH > p.prixDH)) return false
    if (filtre === 'femmes' && p.genre !== 'femme' && p.genre !== 'mixte') return false
    return !m || sansAccents(`${p.nom} ${p.marque} ${p.slug} ${p.categorie}`).includes(m)
  })
}

// ── Commandes ───────────────────────────────────────────────────────────────────────────────────
export type Statut = 'nouvelle' | 'confirmee' | 'expediee' | 'livree' | 'annulee'
export const STATUTS: { cle: Statut; libelle: string }[] = [
  { cle: 'nouvelle', libelle: 'Nouvelle' }, { cle: 'confirmee', libelle: 'Confirmée' }, { cle: 'expediee', libelle: 'Expédiée' },
  { cle: 'livree', libelle: 'Livrée' }, { cle: 'annulee', libelle: 'Annulée' },
]
export const libelleStatut = (s: string) => STATUTS.find(x => x.cle === s)?.libelle ?? s

export interface CommandeAdmin {
  reference: string; cree_le: string; statut: Statut; sous_total_dh: number
  nom: string; telephone: string; email: string; ville: string; adresse: string; instructions: string
  lignes_commande: { slug: string; nom: string; coloris: string; taille: string; quantite: number; prix_dh: number }[]
}

export function filtrerCommandes(liste: CommandeAdmin[], q: string, statut: Statut | 'toutes') {
  const m = sansAccents(q.trim())
  const chiffres = q.replace(/\D/g, '')
  return liste.filter(c => (statut === 'toutes' || c.statut === statut) && (!m
    || sansAccents(`${c.reference} ${c.nom} ${c.ville} ${c.email}`).includes(m)
    || (chiffres.length >= 3 && c.telephone.replace(/\D/g, '').includes(chiffres))))
}

/** Export tableur : séparateur « ; » (Excel en français), guillemets doublés, BOM pour les accents. */
export function csvCommandes(liste: CommandeAdmin[]) {
  const cellule = (v: unknown) => {
    const s = String(v ?? '')
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const entete = ['Référence', 'Date', 'Statut', 'Client', 'Téléphone', 'E-mail', 'Ville', 'Adresse', 'Instructions', 'Articles', 'Total (DH)']
  const lignes = liste.map(c => [
    c.reference, c.cree_le.slice(0, 16).replace('T', ' '), libelleStatut(c.statut), c.nom, c.telephone, c.email, c.ville, c.adresse, c.instructions,
    c.lignes_commande.map(l => `${l.nom} (${l.coloris}, ${l.taille}) × ${l.quantite}`).join(' | '), c.sous_total_dh,
  ])
  return '﻿' + [entete, ...lignes].map(l => l.map(cellule).join(';')).join('\r\n')
}

// ── Journal ─────────────────────────────────────────────────────────────────────────────────────
export interface EntreeJournal { id: number; cree_le: string; auteur_email: string; action: string; cible: string; details: Record<string, unknown> }

const NOMS_CHAMPS: Record<string, string> = {
  prix_dh: 'prix', prix_barre_dh: 'ancien prix', publie: 'visibilité', nom: 'nom', marque: 'marque', categorie: 'type', genre: 'rayon',
  tailles: 'tailles', coloris: 'coloris', images: 'photos', description: 'description', matiere: 'matière', entretien: 'entretien',
  disponibilite: 'disponibilité', nouveau: 'badge Nouveau', mis_en_avant: 'mise en avant', a_confirmer: 'à confirmer', collections: 'collections', ordre: 'ordre',
}
/** Résumé lisible d'une entrée : « prix : vide → 450 · visibilité : masqué → visible ». */
export function resumerEntree(e: EntreeJournal) {
  const d = e.details ?? {}
  const valeur = (k: string, v: unknown) => {
    if (v === null || v === undefined || v === '') return 'vide'
    if (k === 'publie') return v ? 'visible' : 'masqué'
    if (typeof v === 'boolean') return v ? 'oui' : 'non'
    if (Array.isArray(v)) return v.length ? `${v.length} élément${v.length > 1 ? 's' : ''}` : 'aucun'
    if (typeof v === 'object') return 'modifié'
    return String(v)
  }
  if (e.action === 'produit modifié') {
    return Object.entries(d).map(([k, v]) => {
      const { avant, apres } = (v ?? {}) as { avant?: unknown; apres?: unknown }
      return `${NOMS_CHAMPS[k] ?? k} : ${valeur(k, avant)} → ${valeur(k, apres)}`
    }).join(' · ')
  }
  if (e.action === 'statut de commande') return `${libelleStatut(String(d.avant))} → ${libelleStatut(String(d.apres))}`
  if (e.action === 'produit créé') return `${d.nom ?? ''}${d.prix_dh ? ` · ${d.prix_dh} DH` : ''}`
  if (e.action === 'produit supprimé' || e.action === 'commande supprimée') return String(d.nom ?? '')
  return ''
}

/** Numéro WhatsApp international d'un client marocain : « 06 12 34 56 78 » → « 212612345678 ». Null si inutilisable. */
export function numeroWhatsAppClient(tel: string) {
  let n = tel.replace(/\D/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (/^0[5-7]\d{8}$/.test(n)) n = `212${n.slice(1)}`
  return /^\d{10,15}$/.test(n) ? n : null
}

// ── Réglages ────────────────────────────────────────────────────────────────────────────────────
export type ErreursReglages = Partial<Record<'whatsapp' | 'instagram' | 'facebook' | 'fraisDH' | 'villes', string>>
export function validerReglages(b: import('./types').Boutique): ErreursReglages {
  const e: ErreursReglages = {}
  if (!/^\d{10,15}$/.test(b.whatsapp)) e.whatsapp = 'Numéro international, chiffres seulement (ex. 212612345678).'
  if (b.instagram.url && !/^https:\/\/(www\.)?instagram\.com\//.test(b.instagram.url)) e.instagram = 'Lien Instagram commençant par https://www.instagram.com/'
  if (b.facebook.url && !/^https:\/\/(www\.|m\.)?facebook\.com\//.test(b.facebook.url)) e.facebook = 'Lien Facebook commençant par https://www.facebook.com/'
  if (b.livraison.fraisDH !== null && (!Number.isInteger(b.livraison.fraisDH) || b.livraison.fraisDH < 0 || b.livraison.fraisDH > 10000)) e.fraisDH = 'Montant en dirhams entre 0 et 10 000.'
  if (b.livraison.villes && b.livraison.villes.length === 0) e.villes = 'Cochez au moins une ville.'
  return e
}
