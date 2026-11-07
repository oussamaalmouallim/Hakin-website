import { describe, expect, it, vi } from 'vitest'

vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', genre: 'homme', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: ['iconiques'], prixDH: 500, prixBarreDH: null,
    coloris: [{ nom: 'noir', hex: '#000000' }], tailles: [{ taille: 'M', disponible: true }], disponibilite: 'disponible', description: 'Coton', matiere: null,
    entretien: null, images: [{ src: '/x', alt: 'vue', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: [] },
  { slug: 'b', nom: 'Polo Riviera', marque: 'Casablanca', categorie: 't-shirts', collections: [], prixDH: null, prixBarreDH: null,
    coloris: [{ nom: 'rose', hex: '#ff00cc' }], tailles: [], disponibilite: 'a_confirmer', description: '', matiere: null, entretien: null,
    images: [{ src: '/y', alt: 'vue', vue: 'face' }], nouveau: false, misEnAvant: false, aConfirmer: ['prix'] },
] }))
import {
  csvCommandes, filtrerCommandes, filtrerProduitsAdmin, nettoyerAConfirmer, numeroWhatsAppClient, produitVide, resumerEntree, slugEnSaisie, slugifier,
  validerProduit, validerReglages, type CommandeAdmin,
} from '@/lib/admin'
import { fusionnerBoutique, fusionnerTextes, ligneVersProduit, produitVersLigne, type ProduitAdmin } from '@/lib/produitsBase'
import { HEX_COLORIS, appliquerCatalogue, appliquerReglages, boutique, boutiqueFichier, produits, produitsFichier, textes, trouverProduit } from '@/lib/catalogue'
import { controlerPhoto, largeurCible } from '@/features/admin/photos'

const piece = (x: Partial<ProduitAdmin> = {}): ProduitAdmin => ({
  ...produitVide('t-shirts'), slug: 't-shirt-essai', nom: 'T-shirt essai', marque: 'Essai', publie: false, ...x,
})
const commande = (x: Partial<CommandeAdmin> = {}): CommandeAdmin => ({
  reference: 'HM-1', cree_le: '2026-11-07T10:30:00Z', statut: 'nouvelle', sous_total_dh: 900, nom: 'Sara Alaoui', telephone: '06 12 34 56 78',
  email: '', ville: 'Rabat', adresse: '4 avenue Mohammed V', instructions: '', lignes_commande: [{ slug: 'a', nom: 'T-shirt', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 450 }], ...x,
})

describe('administration : produits', () => {
  it('adresse de page tirée du nom : minuscules, sans accents, tirets', () => {
    expect(slugifier('T-shirt Été « Dior » 2026 !')).toBe('t-shirt-ete-dior-2026')
    expect(slugifier('  ---  ')).toBe('')
    expect(slugEnSaisie('Polo-')).toBe('polo-')
    expect(slugEnSaisie('-Polo Été')).toBe('polo-ete')
  })

  it('validation : nom, adresse unique, prix entier, ancien prix plus élevé', () => {
    expect(validerProduit(piece())).toEqual({})
    expect(validerProduit(piece({ nom: ' ' })).nom).toBeTruthy()
    expect(validerProduit(piece({ slug: 'Avec Espaces' })).slug).toMatch(/invalide/)
    expect(validerProduit(piece(), ['t-shirt-essai']).slug).toMatch(/déjà prise/)
    expect(validerProduit(piece({ prixDH: 0 })).prixDH).toBeTruthy()
    expect(validerProduit(piece({ prixDH: 12.5 })).prixDH).toBeTruthy()
    expect(validerProduit(piece({ prixBarreDH: 600 })).prixBarreDH).toMatch(/d'abord/)
    expect(validerProduit(piece({ prixDH: 500, prixBarreDH: 400 })).prixBarreDH).toMatch(/plus élevé/)
    expect(validerProduit(piece({ prixDH: 500, prixBarreDH: 650 }))).toEqual({})
  })

  it('validation : tailles et coloris sans doublon, photos décrites, pièce visible avec photo', () => {
    expect(validerProduit(piece({ tailles: [{ taille: 'M', disponible: true }, { taille: 'M', disponible: false }] })).tailles).toMatch(/deux fois/)
    expect(validerProduit(piece({ coloris: [{ nom: 'Noir', hex: '#000000' }, { nom: 'noir', hex: '#111111' }] })).coloris).toMatch(/deux fois/)
    expect(validerProduit(piece({ coloris: [{ nom: 'noir', hex: 'noir' }] })).coloris).toBeTruthy()
    expect(validerProduit(piece({ publie: true })).images).toMatch(/au moins une photo/)
    expect(validerProduit(piece({ images: [{ src: '/x', alt: ' ', vue: 'face' }] })).images).toMatch(/Décrivez/)
  })

  it('« À confirmer » suit les données saisies', () => {
    expect(nettoyerAConfirmer({ aConfirmer: ['prix', 'tailles', 'matière'], prixDH: 450, tailles: [], matiere: null, entretien: null })).toEqual(['tailles', 'matière'])
    expect(nettoyerAConfirmer({ aConfirmer: ['prix', 'tailles', 'matière'], prixDH: null, tailles: [{ taille: 'M', disponible: true }], matiere: 'Coton', entretien: null })).toEqual(['prix'])
  })

  it('filtres de la liste : sans prix, masqués, soldes, femmes, recherche sans accents', () => {
    const liste = [
      piece({ slug: 'a', nom: 'Veste été', prixDH: null, publie: true }),
      piece({ slug: 'b', nom: 'Sweat', prixDH: 500, prixBarreDH: 700, publie: true, genre: 'mixte' }),
      piece({ slug: 'c', nom: 'Robe', prixDH: 300, publie: false, genre: 'femme' }),
    ]
    const slugs = (f: Parameters<typeof filtrerProduitsAdmin>[2], q = '') => filtrerProduitsAdmin(liste, q, f).map(p => p.slug)
    expect(slugs('tous')).toEqual(['a', 'b', 'c'])
    expect(slugs('sans-prix')).toEqual(['a'])
    expect(slugs('masques')).toEqual(['c'])
    expect(slugs('soldes')).toEqual(['b'])
    expect(slugs('femmes')).toEqual(['b', 'c'])
    expect(slugs('tous', 'ETE')).toEqual(['a'])
  })

  it('ligne de la base ↔ produit : aller-retour sans perte', () => {
    const p = { ...produitsFichier()[0], publie: false, ordre: 3 }
    expect(ligneVersProduit(produitVersLigne(p, p))).toEqual(p)
    expect(produitVersLigne(produitsFichier()[0]).publie).toBe(true)
  })
})

describe('administration : commandes', () => {
  it('recherche par référence, nom ou téléphone, et filtre par statut', () => {
    const liste = [commande(), commande({ reference: 'HM-2', nom: 'Karim', telephone: '0700000000', statut: 'livree' })]
    expect(filtrerCommandes(liste, 'sara', 'toutes').map(c => c.reference)).toEqual(['HM-1'])
    expect(filtrerCommandes(liste, '0612 34', 'toutes').map(c => c.reference)).toEqual(['HM-1'])
    expect(filtrerCommandes(liste, '', 'livree').map(c => c.reference)).toEqual(['HM-2'])
  })

  it('export tableur : point-virgule, guillemets doublés, accents (BOM)', () => {
    const csv = csvCommandes([commande({ instructions: 'Sonner "2 fois"; merci' })])
    expect(csv.startsWith('﻿Référence;Date;Statut')).toBe(true)
    const ligne = csv.split('\r\n')[1]
    expect(ligne).toContain('HM-1;2026-11-07 10:30;Nouvelle;Sara Alaoui')
    expect(ligne).toContain('"Sonner ""2 fois""; merci"')
    expect(ligne).toContain('T-shirt (noir, M) × 2;900')
  })

  it('numéro WhatsApp du client au format international', () => {
    expect(numeroWhatsAppClient('06 12 34 56 78')).toBe('212612345678')
    expect(numeroWhatsAppClient('+212 7 00 00 00 00')).toBe('212700000000')
    expect(numeroWhatsAppClient('0033 6 11 22 33 44')).toBe('33611223344')
    expect(numeroWhatsAppClient('123')).toBeNull()
  })
})

describe('administration : journal et réglages', () => {
  it('résumé lisible d\'une modification', () => {
    expect(resumerEntree({ id: 1, cree_le: '', auteur_email: '', action: 'produit modifié', cible: 'a',
      details: { prix_dh: { avant: null, apres: 520 }, publie: { avant: false, apres: true }, tailles: { avant: [], apres: [1, 2] } } }))
      .toBe('prix : vide → 520 · visibilité : masqué → visible · tailles : aucun → 2 éléments')
    expect(resumerEntree({ id: 2, cree_le: '', auteur_email: '', action: 'statut de commande', cible: 'HM-1', details: { avant: 'nouvelle', apres: 'livree' } }))
      .toBe('Nouvelle → Livrée')
  })

  it('validation des réglages : WhatsApp, liens des réseaux, frais', () => {
    const b = boutiqueFichier()
    expect(validerReglages(b)).toEqual({})
    expect(validerReglages({ ...b, whatsapp: '0612' }).whatsapp).toBeTruthy()
    expect(validerReglages({ ...b, instagram: { ...b.instagram, url: 'http://instagram.com/x' } }).instagram).toBeTruthy()
    expect(validerReglages({ ...b, livraison: { ...b.livraison, fraisDH: -5 } }).fraisDH).toBeTruthy()
    expect(validerReglages({ ...b, livraison: { ...b.livraison, fraisDH: 0 } })).toEqual({})
  })

  it('réglages de la base complétés par le fichier ; paiement à la livraison non modifiable', () => {
    const b = fusionnerBoutique(boutiqueFichier(), { livraison: { zones: 'Tout le Maroc', fraisDH: 30, delai: null }, paiement: 'Carte bancaire' })
    expect(b.livraison.zones).toBe('Tout le Maroc')
    expect(b.whatsapp).toBe(boutiqueFichier().whatsapp)
    expect(b.paiement).toBe(boutiqueFichier().paiement)
    expect(fusionnerTextes({ cgv: { Objet: 'x' } })).toEqual({ 'mentions-legales': {}, cgv: { Objet: 'x' }, confidentialiteResponsable: '', guideDesTailles: '' })
  })
})

describe('catalogue et réglages remplacés sur place', () => {
  it('les modules qui ont importé `produits` et `boutique` voient les données de la base', () => {
    const avant = produitsFichier()
    const ref = produits
    appliquerCatalogue([{ ...avant[0], prixDH: 520, coloris: [{ nom: 'violet essai', hex: '#663399' }] }])
    expect(ref).toBe(produits)
    expect(produits).toHaveLength(1)
    expect(trouverProduit(avant[0].slug)?.prixDH).toBe(520)
    expect(HEX_COLORIS['violet essai']).toBe('#663399')
    appliquerReglages({ livraison: { zones: null, fraisDH: 25, delai: null } }, { guideDesTailles: 'Taille normalement.' })
    expect(boutique.livraison.fraisDH).toBe(25)
    expect(textes.guideDesTailles).toBe('Taille normalement.')
    appliquerCatalogue(avant); appliquerReglages(null, null)
    expect(produits).toHaveLength(avant.length)
    expect(boutique.livraison.fraisDH).toBe(boutiqueFichier().livraison.fraisDH)
  })
})

describe('photos', () => {
  it('formats et poids acceptés ; jamais d\'agrandissement', () => {
    expect(controlerPhoto(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBeNull()
    expect(controlerPhoto(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toMatch(/n'est pas une photo/)
    const lourd = new File(['x'], 'b.png', { type: 'image/png' })
    Object.defineProperty(lourd, 'size', { value: 16 * 1024 * 1024 })
    expect(controlerPhoto(lourd)).toMatch(/15 Mo/)
    expect(largeurCible(600, 960)).toBe(600)
    expect(largeurCible(2000, 480)).toBe(480)
  })
})
