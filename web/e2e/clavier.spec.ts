import type { Page } from '@playwright/test'
import { test, expect, PIECE } from './outils'

/** Audit clavier : tout se fait sans souris, le focus se voit toujours, les panneaux le gardent et le rendent. */
test.skip(({ isMobile }) => isMobile, 'clavier : ordinateur seulement')

const focus = (page: Page) => page.evaluate(() => {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return null
  const s = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  return {
    nom: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60),
    balise: el.tagName.toLowerCase(),
    visible: r.width > 0 && r.height > 0,
    // Anneau de focus : contour ou ombre portée non nuls
    anneau: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== 'none' && s.boxShadow !== ''),
    dansDialogue: !!el.closest('[role="dialog"]'),
  }
})

async function tabuler(page: Page, n: number) {
  const vus = []
  for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); vus.push(await focus(page)) }
  return vus
}

test('premier Tab : lien d\'évitement vers le contenu', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const f = await focus(page)
  expect(f?.nom).toBe('Aller au contenu')
  expect(f?.visible).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#contenu$/)
})

for (const url of ['/', '/boutique', `/produit/${PIECE.slug}`, '/commande', '/connexion', '/contact']) {
  test(`focus toujours visible au Tab sur ${url}`, async ({ page }) => {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    const vus = (await tabuler(page, 25)).filter(Boolean)
    const sansAnneau = vus.filter(f => !f!.anneau || !f!.visible).map(f => `${f!.balise} « ${f!.nom} »`)
    expect(sansAnneau, 'éléments atteints au clavier sans anneau de focus visible').toEqual([])
  })
}

test('recherche : ouverte au clavier, focus dans le champ, Échap ferme et rend le focus', async ({ page }) => {
  await page.goto('/')
  const bouton = page.getByRole('button', { name: 'Rechercher' })
  await bouton.focus()
  await page.keyboard.press('Enter')
  const panneau = page.getByRole('dialog', { name: 'Recherche' })
  await expect(panneau).toBeVisible()
  await expect(panneau.getByRole('textbox').or(panneau.getByRole('searchbox')).first()).toBeFocused()
  // Le focus reste piégé dans le panneau
  for (const f of await tabuler(page, 12)) expect(f?.dansDialogue).toBe(true)
  await page.keyboard.press('Escape')
  await expect(panneau).toBeHidden()
  await expect(bouton).toBeFocused()
})

test('panier en tiroir : focus piégé, Échap ferme et rend le focus', async ({ page }) => {
  await page.goto('/')
  const bouton = page.getByRole('button', { name: /^Panier/ })
  await bouton.focus()
  await page.keyboard.press('Enter')
  const tiroir = page.getByRole('dialog', { name: 'Panier' })
  await expect(tiroir).toBeVisible()
  for (const f of await tabuler(page, 8)) expect(f?.dansDialogue).toBe(true)
  await page.keyboard.press('Escape')
  await expect(tiroir).toBeHidden()
  await expect(bouton).toBeFocused()
})

test('fiche produit : taille et ajout au panier au clavier seul', async ({ page }) => {
  await page.goto(`/produit/${PIECE.slug}`)
  const m = page.getByRole('radio', { name: 'Taille M' })
  await m.focus()
  await page.keyboard.press('Space')
  await expect(m).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: /^Ajouter au panier/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Panier' })).toContainText(PIECE.nom)
})

test('commande : remplie et envoyée au clavier seul, erreur focalisée', async ({ page, ouvertures }) => {
  await page.goto(`/commande?article=${PIECE.slug}&coloris=noir&taille=M&qte=1`)
  const nom = page.getByRole('textbox', { name: 'Nom complet' })
  await page.getByRole('button', { name: 'Passer la commande' }).focus()
  await page.keyboard.press('Enter')
  // Après une erreur, le focus va au premier champ fautif
  await expect(nom).toBeFocused()
  await page.keyboard.type('Client Clavier')
  await page.keyboard.press('Tab'); await page.keyboard.type('0612345678')
  await page.keyboard.press('Tab')
  await page.getByRole('combobox', { name: 'Ville' }).selectOption('Casablanca') // liste native : choix au clavier du système
  await page.getByRole('textbox', { name: 'Adresse', exact: true }).focus()
  await page.keyboard.type('12 rue du clavier')
  await page.getByRole('checkbox').focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Passer la commande' }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(ouvertures).toHaveLength(1)
})

test('connexion : formulaire utilisable au clavier', async ({ page }) => {
  await page.goto('/connexion')
  const vus = (await tabuler(page, 10)).filter(Boolean).map(f => f!.balise)
  expect(vus).toContain('input')
  expect(vus).toContain('button')
})
