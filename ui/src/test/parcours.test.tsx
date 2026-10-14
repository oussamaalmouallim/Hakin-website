import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/data/produits.json', () => ({ default: [
  { slug: 'a', nom: 'T-shirt Été', marque: 'Dior', categorie: 't-shirts', collections: ['iconiques'], prixDH: 500, prixBarreDH: null,
    coloris: [{ nom: 'noir', hex: '#000' }], tailles: [{ taille: 'M', disponible: true }, { taille: 'XL', disponible: false }],
    disponibilite: 'disponible', description: 'Coton léger', matiere: null, entretien: null, images: [{ src: '/x', alt: 'vue', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: [] },
  { slug: 'b', nom: 'Polo Riviera', marque: 'Casablanca', categorie: 't-shirts', collections: ['riviera'], prixDH: null, prixBarreDH: null,
    coloris: [{ nom: 'rose', hex: '#f0c' }], tailles: [], disponibilite: 'a_confirmer', description: 'Imprimé', matiere: null, entretien: null,
    images: [{ src: '/y', alt: 'vue', vue: 'face' }], nouveau: false, misEnAvant: true, aConfirmer: ['prix'] },
] }))

const { default: App } = await import('@/App')
const { FournisseurAnimations } = await import('@/state/animations')
const { FournisseurNotifications } = await import('@/design-system')
const { usePanier } = await import('@/state/panier')

// jsdom : APIs absentes
window.scrollTo = vi.fn() as never
class IO { observe() {} unobserve() {} disconnect() {} }
;(window as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO
window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) as never

const monter = (url: string) => render(
  <MemoryRouter initialEntries={[url]}><FournisseurAnimations><FournisseurNotifications><App /></FournisseurNotifications></FournisseurAnimations></MemoryRouter>)

describe('parcours d\'achat', () => {
  beforeEach(() => { usePanier.getState().vider(); sessionStorage.setItem('hmode-vu', '1') })

  it('fiche produit : refuse l\'ajout sans taille, puis ajoute la variante choisie', async () => {
    const u = userEvent.setup()
    monter('/produit/a')
    expect(await screen.findByRole('heading', { level: 1, name: 'T-shirt Été' })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Ajouter au panier' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Veuillez choisir une taille')
    expect(usePanier.getState().lignes).toHaveLength(0)
    expect(screen.getByRole('radio', { name: 'Taille XL, indisponible' })).toBeDisabled()
    await u.click(screen.getByRole('radio', { name: 'Taille M' }))
    await u.click(screen.getByRole('button', { name: 'Augmenter la quantité' }))
    await u.click(screen.getByRole('button', { name: 'Ajouter au panier' }))
    expect(usePanier.getState().lignes).toEqual([{ cle: 'a|noir|M', slug: 'a', coloris: 'noir', taille: 'M', quantite: 2 }])
    const tiroir = await screen.findByRole('dialog', { name: 'Panier' })
    expect(within(tiroir).getAllByText('1 000 DH').length).toBeGreaterThan(0)
  })

  it('produit sans prix : pas d\'ajout au panier, demande sur WhatsApp', async () => {
    monter('/produit/b')
    expect(await screen.findAllByText('Prix sur demande')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Ajouter au panier' })).not.toBeInTheDocument()
    const lien = screen.getByRole('link', { name: /Demander prix et disponibilité/ })
    expect(lien).toHaveAttribute('href', expect.stringContaining('wa.me/212625490034'))
  })

  it('commande : erreurs de validation puis envoi WhatsApp', async () => {
    const u = userEvent.setup()
    const ouvrir = vi.spyOn(window, 'open').mockReturnValue(null)
    usePanier.getState().ajouter('a', 'noir', 'M', 1)
    monter('/commande')
    await u.click(await screen.findByRole('button', { name: /Envoyer ma commande/ }))
    expect(screen.getByText('Indiquez votre nom complet.')).toBeInTheDocument()
    expect(ouvrir).not.toHaveBeenCalled()
    await u.type(screen.getByLabelText('Nom complet'), 'Ali Benani')
    await u.type(screen.getByLabelText('Téléphone (WhatsApp)'), '0612345678')
    await u.selectOptions(screen.getByLabelText('Ville'), 'Casablanca')
    await u.type(screen.getByLabelText('Adresse'), '12 rue de la Liberté')
    await u.click(screen.getByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: /Envoyer ma commande/ }))
    expect(ouvrir).toHaveBeenCalledOnce()
    const url = decodeURIComponent(String(ouvrir.mock.calls[0][0])).replace(/\u00a0/g, ' ')
    expect(url).toContain('Dior — T-shirt Été — noir, taille M × 1 = 500 DH')
    expect(url).toContain('Ali Benani')
    expect(await screen.findByRole('button', { name: "J'ai envoyé ma commande" })).toBeInTheDocument()
    expect(usePanier.getState().lignes).toHaveLength(1) // pas vidé avant confirmation du client
    await u.click(screen.getByRole('button', { name: "J'ai envoyé ma commande" }))
    expect(usePanier.getState().lignes).toHaveLength(0)
  })

  it('route inconnue → 404 ; réseaux officiels présents', async () => {
    monter('/nimporte-quoi')
    expect(await screen.findByText("Cette page s'est éclipsée")).toBeInTheDocument()
    const hrefs = screen.getAllByRole('link').map(a => a.getAttribute('href'))
    expect(hrefs).toContain('https://www.instagram.com/hmod_e2121/')
    expect(hrefs).toContain('https://www.facebook.com/profile.php?id=61594200016066')
  })
})
