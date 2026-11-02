import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: [], prixDH: 500, prixBarreDH: null,
    coloris: [{ nom: 'noir', hex: '#000' }], tailles: [{ taille: 'M', disponible: true }], disponibilite: 'disponible', description: 'Coton', matiere: null, entretien: null,
    images: [{ src: '/x', alt: 'vue', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: [] },
] }))

/** Faux Supabase : seule la fonction passer_commande est observée ; aucune session (client sans compte). */
const rpc = vi.fn()
const requete: Record<string, unknown> = {}
for (const m of ['select', 'eq', 'in', 'order', 'maybeSingle', 'update', 'upsert', 'delete']) requete[m] = () => requete
requete.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(ok)
const auth = { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) }
vi.mock('@/lib/supabase', () => ({ supabaseActif: true, memoriserSession: () => {}, obtenirSupabase: async () => ({ auth, rpc, from: () => requete }) }))

window.scrollTo = vi.fn() as never
class IO { observe() {} unobserve() {} disconnect() {} }
;(window as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO
window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) as never

const { default: App } = await import('@/App')
const { FournisseurAnimations } = await import('@/state/animations')
const { FournisseurNotifications } = await import('@/design-system')
const { usePanier } = await import('@/state/panier')
const { useCompte } = await import('@/state/compte')

const monter = (url: string) => render(
  <MemoryRouter initialEntries={[url]}><FournisseurAnimations><FournisseurNotifications><App /></FournisseurNotifications></FournisseurAnimations></MemoryRouter>)

async function remplir(u: ReturnType<typeof userEvent.setup>) {
  await u.type(await screen.findByLabelText('Nom complet'), 'Sara Alaoui')
  await u.type(screen.getByLabelText('Téléphone (WhatsApp)'), '0612345678')
  await u.selectOptions(screen.getByLabelText('Ville'), 'Rabat')
  await u.type(screen.getByLabelText('Adresse'), '4 avenue Mohammed V')
  await u.click(screen.getByRole('checkbox', { name: /conditions de vente/ }))
}

describe('checkout : commande enregistrée en base puis WhatsApp, paiement à la livraison', () => {
  beforeEach(() => {
    sessionStorage.setItem('hmode-vu', '1')
    usePanier.getState().remplacer([], null)
    useCompte.getState().toutEffacer()
    rpc.mockReset()
  })

  it('enregistre la commande (lignes, prix, client), ouvre WhatsApp, vide le panier, affiche la confirmation', async () => {
    const u = userEvent.setup()
    const onglet = { opener: {}, location: { href: '' }, close: vi.fn() }
    const ouvrir = vi.spyOn(window, 'open').mockReturnValue(onglet as unknown as Window)
    rpc.mockImplementation(async (_f: string, { commande }: { commande: { reference: string } }) => ({ data: commande.reference, error: null }))
    usePanier.getState().ajouter('a', 'noir', 'M', 2)
    monter('/commande')
    await u.click(await screen.findByRole('button', { name: 'Passer la commande' }))
    expect(screen.getAllByText('Indiquez votre nom complet.').length).toBeGreaterThan(0)
    expect(rpc).not.toHaveBeenCalled()
    await remplir(u)
    await u.click(screen.getByRole('button', { name: 'Passer la commande' }))
    expect(await screen.findByRole('heading', { name: 'Commande enregistrée' })).toBeInTheDocument()
    expect(rpc).toHaveBeenCalledWith('passer_commande', { commande: expect.objectContaining({
      client: { nom: 'Sara Alaoui', telephone: '0612345678', email: '', ville: 'Rabat', adresse: '4 avenue Mohammed V', instructions: '' },
      lignes: [{ slug: 'a', nom: 'T-shirt Été', coloris: 'noir', taille: 'M', quantite: 2, prix_dh: 500 }],
    }) })
    expect(ouvrir).toHaveBeenCalledWith('', '_blank')
    expect(onglet.location.href).toMatch(/^https:\/\/wa\.me\/212625490034\?text=/)
    expect(onglet.opener).toBeNull()
    expect(usePanier.getState().lignes).toEqual([])
    expect(useCompte.getState().commandes).toHaveLength(1) // historique visiteur sur l'appareil
    expect(useCompte.getState().profil.nom).toBe('Sara Alaoui')
    expect(screen.getByRole('link', { name: /Envoyer le récapitulatif sur WhatsApp/ })).toHaveAttribute('href', expect.stringContaining('wa.me/212625490034'))
  })

  it('enregistrement refusé : message, WhatsApp refermé, panier intact, pas de confirmation', async () => {
    const u = userEvent.setup()
    const onglet = { opener: {}, location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(onglet as unknown as Window)
    rpc.mockResolvedValue({ data: null, error: { message: 'new row violates check constraint' } })
    usePanier.getState().ajouter('a', 'noir', 'M', 1)
    monter('/commande')
    await remplir(u)
    await u.click(screen.getByRole('button', { name: 'Passer la commande' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Votre commande n'a pas pu être enregistrée")
    expect(onglet.close).toHaveBeenCalled()
    expect(usePanier.getState().lignes).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Commande enregistrée' })).not.toBeInTheDocument()
  })

  it('commande directe : seule la pièce choisie est enregistrée, le panier n\'est pas touché', async () => {
    const u = userEvent.setup()
    vi.spyOn(window, 'open').mockReturnValue(null)
    rpc.mockImplementation(async (_f: string, { commande }: { commande: { reference: string } }) => ({ data: commande.reference, error: null }))
    usePanier.getState().ajouter('a', 'noir', 'M', 4)
    monter('/commande?article=a&coloris=noir&taille=M&qte=1')
    await remplir(u)
    await u.click(screen.getByRole('button', { name: 'Passer la commande' }))
    expect(await screen.findByRole('heading', { name: 'Commande enregistrée' })).toBeInTheDocument()
    expect(rpc.mock.calls[0][1].commande.lignes).toEqual([{ slug: 'a', nom: 'T-shirt Été', coloris: 'noir', taille: 'M', quantite: 1, prix_dh: 500 }])
    expect(usePanier.getState().lignes.map(l => l.quantite)).toEqual([4])
  })
})
