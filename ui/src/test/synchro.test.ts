import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: [], prixDH: 500, prixBarreDH: null, coloris: [{ nom: 'noir', hex: '#000' }],
    tailles: [{ taille: 'M', disponible: true }], disponibilite: 'disponible', description: '', matiere: null, entretien: null, images: [{ src: '/x', alt: '', vue: 'face' }], nouveau: false, misEnAvant: false, aConfirmer: [] },
  { slug: 'b', nom: 'Sweat', marque: 'Nike', categorie: 'sweats', collections: [], prixDH: 700, prixBarreDH: null, coloris: [{ nom: 'gris', hex: '#888' }],
    tailles: [{ taille: 'L', disponible: true }], disponibilite: 'disponible', description: '', matiere: null, entretien: null, images: [{ src: '/y', alt: '', vue: 'face' }], nouveau: false, misEnAvant: false, aConfirmer: [] },
] }))

/** Fausse base Supabase en mémoire, avec la même règle que la RLS : chaque compte ne voit et n'écrit que ses lignes. */
type Ligne = Record<string, unknown>
const base: Record<string, Ligne[]> = { profils: [], paniers: [], favoris: [], adresses: [], commandes: [], lignes_commande: [] }
const PROPRIETAIRE: Record<string, string> = { profils: 'id', paniers: 'utilisateur', favoris: 'utilisateur', adresses: 'utilisateur', commandes: 'utilisateur' }
const CLE: Record<string, string[]> = { profils: ['id'], paniers: ['utilisateur'], favoris: ['utilisateur', 'slug'], adresses: ['id'] }
let connecte: string | null = null

class Requete {
  private mode: 'select' | 'update' | 'upsert' | 'delete' = 'select'
  private valeur: Ligne | Ligne[] = {}
  private filtres: ((l: Ligne) => boolean)[] = []
  private unique = false
  constructor(private table: string) {}
  select() { return this }
  order() { return this }
  maybeSingle() { this.unique = true; return this }
  eq(c: string, v: unknown) { this.filtres.push(l => l[c] === v); return this }
  in(c: string, vs: unknown[]) { this.filtres.push(l => vs.includes(l[c])); return this }
  update(v: Ligne) { this.mode = 'update'; this.valeur = v; return this }
  upsert(v: Ligne | Ligne[]) { this.mode = 'upsert'; this.valeur = v; return this }
  delete() { this.mode = 'delete'; return this }
  then<A, B>(ok?: ((v: { data: unknown; error: { message: string } | null }) => A) | null, ko?: ((e: unknown) => B) | null) {
    return Promise.resolve(this.executer()).then(ok, ko)
  }
  private executer() {
    const t = base[this.table]
    const proprio = PROPRIETAIRE[this.table]
    const visibles = t.filter(l => l[proprio] === connecte && this.filtres.every(f => f(l)))
    if (this.mode === 'select') {
      const lignes = visibles.map(l => this.table === 'commandes' ? { ...l, lignes_commande: base.lignes_commande.filter(x => x.commande === l.id) } : { ...l })
      return { data: this.unique ? lignes[0] ?? null : lignes, error: null }
    }
    if (this.mode === 'update') { visibles.forEach(l => Object.assign(l, this.valeur)); return { data: null, error: null } }
    if (this.mode === 'delete') { base[this.table] = t.filter(l => !visibles.includes(l)); return { data: null, error: null } }
    for (const v of [this.valeur].flat()) {
      if (v[proprio] !== connecte) return { data: null, error: { message: 'new row violates row-level security policy' } }
      const existe = t.find(l => CLE[this.table].every(c => l[c] === v[c]))
      if (existe && existe[proprio] !== connecte) return { data: null, error: { message: 'new row violates row-level security policy' } }
      if (existe) Object.assign(existe, v); else t.push({ cree_le: new Date().toISOString(), ...v })
    }
    return { data: null, error: null }
  }
}
const faux = { from: (t: string) => new Requete(t), auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), getSession: async () => ({ data: { session: null } }) } }
vi.mock('@/lib/supabase', () => ({ supabaseActif: true, memoriserSession: () => {}, obtenirSupabase: async () => faux }))

const { usePanier } = await import('@/state/panier')
const { useFavoris } = await import('@/state/favoris')
const { useCompte } = await import('@/state/compte')
const { useSession } = await import('@/state/session')
const { brancherSynchroCompte, viderFileSynchro } = await import('@/state/synchroCompte')

const attendre = (ms = 30) => new Promise(r => setTimeout(r, ms))
const contenuPanier = () => usePanier.getState().lignes.map(l => `${l.slug}:${l.quantite}`).sort()
async function seConnecter(id: string, email = `${id}@exemple.ma`) {
  connecte = id
  if (!base.profils.some(p => p.id === id)) base.profils.push({ id, nom: '', telephone: '', email })
  useSession.setState({ utilisateur: { id, email, nom: '' } })
  await attendre()
}
async function seDeconnecter() { await viderFileSynchro(); useSession.setState({ utilisateur: null }); connecte = null; await attendre() }

const debrancher = brancherSynchroCompte()
afterAll(() => debrancher())

describe('compte synchronisé (Supabase simulé, RLS par compte)', () => {
  beforeEach(async () => {
    if (useSession.getState().utilisateur) await seDeconnecter()
    for (const k of Object.keys(base)) base[k] = []
    usePanier.getState().remplacer([], null)
    useFavoris.getState().remplacer([], null)
    useCompte.getState().toutEffacer()
  })

  it('connexion : le panier visiteur rejoint le panier du compte, sans doublon à l\'actualisation', async () => {
    base.paniers.push({ utilisateur: 'sara', lignes: [{ slug: 'a', coloris: 'noir', taille: 'M', quantite: 1 }] })
    usePanier.getState().ajouter('a', 'noir', 'M', 2)
    usePanier.getState().ajouter('b', 'gris', 'L', 1)
    await seConnecter('sara')
    expect(contenuPanier()).toEqual(['a:3', 'b:1'])
    expect((base.paniers[0].lignes as unknown[]).length).toBe(2) // fusion enregistrée dans le compte
    // Actualisation : même compte, panier local déjà rattaché → le compte fait foi, rien n'est additionné deux fois.
    useSession.setState({ utilisateur: null }); await attendre() // (simulé : la page se recharge)
    usePanier.getState().remplacer([{ cle: 'a|noir|M', slug: 'a', coloris: 'noir', taille: 'M', quantite: 3 }, { cle: 'b|gris|L', slug: 'b', coloris: 'gris', taille: 'L', quantite: 1 }], 'sara')
    await seConnecter('sara')
    expect(contenuPanier()).toEqual(['a:3', 'b:1'])
  })

  it('modifications enregistrées, déconnexion qui vide l\'appareil, reconnexion qui retrouve tout', async () => {
    await seConnecter('sara')
    usePanier.getState().ajouter('b', 'gris', 'L', 2)
    useCompte.getState().majProfil({ nom: 'Sara Alaoui', telephone: '0612345678' })
    useCompte.getState().enregistrerAdresse({ libelle: 'Maison', ville: 'Rabat', adresse: '4 avenue Mohammed V', instructions: '', parDefaut: true })
    await attendre(500) // regroupement de 400 ms
    expect(base.paniers[0].lignes).toEqual([{ slug: 'b', coloris: 'gris', taille: 'L', quantite: 2 }])
    expect(base.profils[0]).toMatchObject({ nom: 'Sara Alaoui', telephone: '0612345678' })
    expect(base.adresses).toHaveLength(1)

    await seDeconnecter()
    expect(usePanier.getState().lignes).toEqual([])
    expect(useCompte.getState().adresses).toEqual([])
    expect(useCompte.getState().profil.nom).toBe('')

    await seConnecter('sara')
    expect(contenuPanier()).toEqual(['b:2'])
    expect(useCompte.getState().profil.nom).toBe('Sara Alaoui')
    expect(useCompte.getState().adresses.map(a => a.ville)).toEqual(['Rabat'])
  })

  it('suppression d\'une adresse répercutée dans le compte', async () => {
    await seConnecter('sara')
    useCompte.getState().enregistrerAdresse({ libelle: 'A', ville: 'Rabat', adresse: '1 rue A', instructions: '', parDefaut: true })
    useCompte.getState().enregistrerAdresse({ libelle: 'B', ville: 'Fès', adresse: '2 rue B', instructions: '', parDefaut: false })
    await attendre(500)
    expect(base.adresses).toHaveLength(2)
    useCompte.getState().supprimerAdresse(useCompte.getState().adresses[0].id)
    await attendre(500)
    expect(base.adresses.map(a => a.ville)).toEqual(['Fès'])
    expect(base.adresses[0].par_defaut).toBe(true)
  })

  it('isolation : un second compte sur le même appareil ne voit rien du premier', async () => {
    await seConnecter('sara')
    usePanier.getState().ajouter('a', 'noir', 'M', 1)
    useCompte.getState().enregistrerAdresse({ libelle: 'Maison', ville: 'Rabat', adresse: '4 avenue Mohammed V', instructions: '', parDefaut: true })
    base.commandes.push({ id: 'c1', utilisateur: 'sara', reference: 'HM-SARA', cree_le: '2026-11-02T10:00:00Z', sous_total_dh: 500, nom: 'Sara', telephone: '0612345678', email: '', ville: 'Rabat', adresse: 'x', instructions: '' })
    base.lignes_commande.push({ commande: 'c1', slug: 'a', nom: 'T-shirt Été', coloris: 'noir', taille: 'M', quantite: 1, prix_dh: 500 })
    await seDeconnecter()

    await seConnecter('karim')
    expect(usePanier.getState().lignes).toEqual([])
    expect(useCompte.getState().adresses).toEqual([])
    expect(useCompte.getState().commandes).toEqual([])
    usePanier.getState().ajouter('b', 'gris', 'L', 1)
    await attendre(500)
    expect(base.paniers.find(p => p.utilisateur === 'sara')!.lignes).toEqual([{ slug: 'a', coloris: 'noir', taille: 'M', quantite: 1 }])
    expect(base.paniers.find(p => p.utilisateur === 'karim')!.lignes).toEqual([{ slug: 'b', coloris: 'gris', taille: 'L', quantite: 1 }])
    await seDeconnecter()

    await seConnecter('sara')
    expect(contenuPanier()).toEqual(['a:1'])
    expect(useCompte.getState().commandes.map(c => c.reference)).toEqual(['HM-SARA'])
    expect(useCompte.getState().commandes[0].lignes[0]).toMatchObject({ slug: 'a', prixDH: 500, quantite: 1 })
  })

  it('panier : variantes fusionnées bornées à 10, produits disparus écartés', async () => {
    base.paniers.push({ utilisateur: 'sara', lignes: [{ slug: 'a', coloris: 'noir', taille: 'M', quantite: 8 }, { slug: 'disparu', coloris: 'x', taille: 'S', quantite: 1 }] })
    usePanier.getState().ajouter('a', 'noir', 'M', 5)
    await seConnecter('sara')
    expect(contenuPanier()).toEqual(['a:10'])
  })

  it('favoris : ceux du visiteur rejoignent le compte, ajouts et retraits enregistrés, appareil vidé à la déconnexion', async () => {
    base.favoris.push({ utilisateur: 'sara', slug: 'a', cree_le: '2026-11-01T10:00:00Z' })
    useFavoris.getState().basculer('b')
    useFavoris.getState().basculer('disparu')
    await seConnecter('sara')
    expect(useFavoris.getState().slugs).toEqual(['a', 'b']) // compte d'abord, pièce disparue écartée
    expect(base.favoris.map(f => f.slug).sort()).toEqual(['a', 'b'])

    useFavoris.getState().basculer('a') // retrait
    await attendre(500)
    expect(base.favoris.map(f => f.slug)).toEqual(['b'])

    await seDeconnecter()
    expect(useFavoris.getState().slugs).toEqual([])
    await seConnecter('sara')
    expect(useFavoris.getState().slugs).toEqual(['b'])
  })

  it('favoris : isolation entre deux comptes, actualisation sans doublon', async () => {
    await seConnecter('sara')
    useFavoris.getState().basculer('a')
    await seDeconnecter()
    await seConnecter('karim')
    expect(useFavoris.getState().slugs).toEqual([])
    useFavoris.getState().basculer('b')
    await attendre(500)
    expect(base.favoris.filter(f => f.utilisateur === 'sara').map(f => f.slug)).toEqual(['a'])
    expect(base.favoris.filter(f => f.utilisateur === 'karim').map(f => f.slug)).toEqual(['b'])
    // Actualisation : favoris déjà rattachés à karim → la base fait foi, rien n'est ajouté deux fois.
    useSession.setState({ utilisateur: null }); await attendre()
    useFavoris.getState().remplacer(['b'], 'karim')
    await seConnecter('karim')
    expect(useFavoris.getState().slugs).toEqual(['b'])
    expect(base.favoris.filter(f => f.utilisateur === 'karim')).toHaveLength(1)
  })
})
