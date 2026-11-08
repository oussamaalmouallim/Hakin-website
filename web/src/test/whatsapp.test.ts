import { describe, expect, it, vi } from 'vitest'

vi.mock('@/data/produits.json', () => ({ default: [] }))
const { lienWhatsApp, messageProduit } = await import('@/lib/whatsapp')

describe('WhatsApp depuis une fiche produit', () => {
  it('message complet : pièce, couleur, taille, lien, question ; prix demandé seulement s\'il n\'est pas affiché', () => {
    const m = messageProduit({ nom: 'T-shirt logo', marque: 'Dior', prixConnu: false },
      { coloris: 'noir', taille: 'M', lien: 'https://hmode.ma/produit/t-shirt-logo', motif: 'renseignement' })
    expect(m).toBe([
      'Bonjour H MODE, je souhaite avoir des informations sur ce produit : Dior — T-shirt logo.',
      'Couleur : noir.', 'Taille : M.', 'Lien : https://hmode.ma/produit/t-shirt-logo', 'Est-elle disponible, et à quel prix ?',
    ].join('\n'))
    expect(messageProduit({ nom: 'X', prixConnu: true })).toMatch(/Est-elle disponible \?$/)
    expect(messageProduit({ nom: 'X' }, { motif: 'alerte_stock' })).toMatch(/me prévenir si elle revient/)
    expect(messageProduit({ nom: 'X' }, { taille: '' })).not.toMatch(/Taille/)
  })
  it('lien wa.me encodé : accents, retours à la ligne, « & » et « ? » survivent', () => {
    const m = messageProduit({ nom: 'Pull & co ?', marque: 'Été' }, { lien: 'https://hmode.ma/produit/a?x=1' })
    const url = new URL(lienWhatsApp(m))
    expect(url.hostname).toBe('wa.me')
    expect(url.searchParams.get('text')).toBe(m)
  })
})
