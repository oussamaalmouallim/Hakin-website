import { beforeEach, describe, expect, it, vi } from 'vitest'

// Catalogue de test : un produit commandable (prix réel de test) + un produit « prix sur demande ».
vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: ['iconiques'], prixDH: 500, prixBarreDH: null,
    coloris: [{ nom: 'noir', hex: '#000' }, { nom: 'blanc', hex: '#fff' }], tailles: [{ taille: 'M', disponible: true }, { taille: 'XL', disponible: false }],
    disponibilite: 'disponible', description: 'Coton léger', matiere: null, entretien: null, images: [{ src: '/x', alt: '', vue: 'face' }], nouveau: false, misEnAvant: false, aConfirmer: [] },
  { slug: 'b', nom: 'Polo Riviera', marque: 'Casablanca', categorie: 't-shirts', collections: ['riviera'], prixDH: null, prixBarreDH: null,
    coloris: [{ nom: 'rose', hex: '#f0c' }], tailles: [], disponibilite: 'a_confirmer', description: 'Imprimé', matiere: null, entretien: null,
    images: [{ src: '/y', alt: '', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: ['prix'] },
] }))

const { usePanier, sousTotal, nbArticles, cleLigne, lignesDetaillees, QTE_MAX } = await import('@/state/panier')
const { estCommandable, produits } = await import('@/lib/catalogue')
const { messageCommande, lienWhatsApp } = await import('@/lib/whatsapp')
const { appliquerFiltres, facettesCroisees, FILTRES_VIDES, filtresDepuisURL, filtresVersURL } = await import('@/lib/filtres')
const { rechercher } = await import('@/lib/recherche')
const { formatDH, telephoneMarocValide } = await import('@/lib/format')
const { validerCommande } = await import('@/features/commande/PageCommande')

const sp = (s: string) => s.replace(/\u00a0/g, ' ')

describe('panier', () => {
  beforeEach(() => usePanier.getState().vider())
  it('fusionne les lignes identiques et calcule les totaux', () => {
    const p = usePanier.getState()
    p.ajouter('a', 'noir', 'M', 2); p.ajouter('a', 'noir', 'M', 1); p.ajouter('a', 'blanc', 'M', 1)
    const { lignes } = usePanier.getState()
    expect(lignes).toHaveLength(2)
    expect(nbArticles(lignes)).toBe(4)
    expect(sousTotal(lignes)).toBe(2000)
  })
  it('borne les quantités entre 1 et 10', () => {
    usePanier.getState().ajouter('a', 'noir', 'M', 50)
    const cle = cleLigne('a', 'noir', 'M')
    expect(usePanier.getState().lignes[0].quantite).toBe(QTE_MAX)
    usePanier.getState().changerQuantite(cle, 0)
    expect(usePanier.getState().lignes[0].quantite).toBe(1)
  })
  it('retire puis restaure une ligne (annulation)', () => {
    usePanier.getState().ajouter('a', 'noir', 'M')
    const l = usePanier.getState().retirer(cleLigne('a', 'noir', 'M'))!
    expect(usePanier.getState().lignes).toHaveLength(0)
    usePanier.getState().restaurer(l)
    expect(usePanier.getState().lignes).toHaveLength(1)
  })
  it('ignore les produits sans prix dans les totaux', () => {
    usePanier.getState().ajouter('b', 'rose', 'M')
    expect(lignesDetaillees(usePanier.getState().lignes)).toHaveLength(0)
    expect(sousTotal(usePanier.getState().lignes)).toBe(0)
  })
})

describe('catalogue', () => {
  it('un produit sans prix ou sans taille disponible n\'est pas commandable', () => {
    expect(estCommandable(produits[0])).toBe(true)
    expect(estCommandable(produits[1])).toBe(false)
  })
})

describe('whatsapp', () => {
  it('génère un message de commande complet et un lien encodé', () => {
    const msg = sp(messageCommande('HM-1', [{ nom: 'Dior — T-shirt Été', coloris: 'noir', taille: 'M', quantite: 2, prixDH: 500 }],
      { nom: 'Ali B', telephone: '0612345678', email: '', ville: 'Casablanca', adresse: '12 rue X', instructions: '' }))
    expect(msg).toContain('réf. HM-1')
    expect(msg).toContain('× 2 = 1 000 DH')
    expect(msg).toContain('Sous-total : 1 000 DH')
    expect(msg).toContain('Mode de paiement : Paiement à la livraison')
    expect(msg).not.toContain('E-mail')
    expect(lienWhatsApp(msg)).toMatch(/^https:\/\/wa\.me\/212625490034\?text=/)
  })
})

describe('filtres et recherche', () => {
  it('combine les filtres et place « prix sur demande » en fin de tri croissant', () => {
    expect(appliquerFiltres(produits, { ...FILTRES_VIDES, marques: ['Dior'] }).map(p => p.slug)).toEqual(['a'])
    expect(appliquerFiltres(produits, { ...FILTRES_VIDES, coloris: ['rose'], collections: ['riviera'] }).map(p => p.slug)).toEqual(['b'])
    expect(appliquerFiltres(produits, { ...FILTRES_VIDES, tailles: ['XL'] })).toHaveLength(0)
    expect(appliquerFiltres(produits, { ...FILTRES_VIDES, tri: 'prix-croissant' }).map(p => p.slug)).toEqual(['a', 'b'])
  })
  it('facettes croisées : chaque groupe ignore son propre filtre et compte à 0 ce qui ne donne rien', () => {
    const f = facettesCroisees(produits, { ...FILTRES_VIDES, marques: ['Casablanca'] })
    expect(f.marques).toEqual([{ valeur: 'Casablanca', n: 1 }, { valeur: 'Dior', n: 1 }])
    expect(f.coloris.find(c => c.valeur === 'noir')?.n).toBe(0)
    expect(f.coloris.find(c => c.valeur === 'rose')?.n).toBe(1)
    expect(f.collections).toEqual([{ valeur: 'iconiques', n: 0 }, { valeur: 'riviera', n: 1 }])
    expect(f.disponibles).toBe(0)
    expect(f.avecPrix).toBe(true)
  })
  it('aller-retour URL', () => {
    const f = { ...FILTRES_VIDES, marques: ['Dior', 'Amiri'], disponibles: true, tri: 'nom' as const }
    expect(filtresDepuisURL(filtresVersURL(f))).toEqual(f)
  })
  it('recherche sans accents ni casse, tous les mots requis', () => {
    expect(rechercher(produits, 'ete').map(p => p.slug)).toEqual(['a'])
    expect(rechercher(produits, 'CASABLANCA rose').map(p => p.slug)).toEqual(['b'])
    expect(rechercher(produits, 'dior rose')).toHaveLength(0)
  })
})

describe('format et validation', () => {
  it('format DH et téléphone marocain', () => {
    expect(formatDH(1250)).toBe('1\u00a0250\u00a0DH')
    for (const ok of ['0612345678', '+212 6 12 34 56 78', '00212712345678', '05 22 11 22 33']) expect(telephoneMarocValide(ok)).toBe(true)
    for (const ko of ['0812345678', '061234567', '+33612345678']) expect(telephoneMarocValide(ko)).toBe(false)
  })
  it('valide la commande champ par champ', () => {
    const vide = { nom: '', telephone: '', email: 'x', ville: '', adresse: '', instructions: '' }
    expect(Object.keys(validerCommande(vide, false)).sort()).toEqual(['adresse', 'cgv', 'email', 'nom', 'telephone', 'ville'])
    expect(validerCommande({ nom: 'Ali B', telephone: '0612345678', email: '', ville: 'Rabat', adresse: '12 rue X', instructions: '' }, true)).toEqual({})
  })
})
