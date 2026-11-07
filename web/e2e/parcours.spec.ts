import { test, expect, PIECE } from './outils'

test.describe('parcours d\'achat dans un vrai navigateur', () => {
  test('accueil → fiche → panier → commande → WhatsApp', async ({ page, ouvertures }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto(`/produit/${PIECE.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: PIECE.nom })).toBeVisible()
    // Sans taille : bouton en aria-disabled (Playwright le voit inactif), le clic affiche le refus
    await page.getByRole('button', { name: /^Ajouter au panier/ }).click({ force: true })
    await expect(page.getByRole('alert')).toContainText('Veuillez choisir une taille')
    await page.getByRole('radio', { name: 'Taille M' }).click()
    await page.getByRole('button', { name: /^Ajouter au panier/ }).click()
    const tiroir = page.getByRole('dialog', { name: 'Panier' })
    await expect(tiroir).toBeVisible()
    await expect(tiroir).toContainText(PIECE.nom)

    // Le panier survit à l'actualisation
    await page.goto('/panier')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Panier' })).toBeVisible()
    await expect(page.getByText('1 article', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Commander' }).click()

    // Commande : erreurs, puis envoi
    await expect(page).toHaveURL(/\/commande$/)
    await page.getByRole('button', { name: 'Passer la commande' }).click()
    await expect(page.getByText('Indiquez votre nom complet.')).toBeVisible()
    expect(await ouvertures()).toEqual([])
    await page.getByRole('textbox', { name: 'Nom complet' }).fill('Client Essai')
    await page.getByRole('textbox', { name: 'Téléphone (WhatsApp)' }).fill('0612345678')
    await page.getByRole('combobox', { name: 'Ville' }).selectOption('Casablanca')
    await page.getByRole('textbox', { name: 'Adresse', exact: true }).fill('12 rue de test')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Passer la commande' }).click()
    await expect.poll(ouvertures).toHaveLength(1)
    const message = decodeURIComponent((await ouvertures())[0]).replace(/ /g, ' ')
    expect(message).toContain('wa.me/')
    expect(message).toContain(`Prada — ${PIECE.nom} — noir, taille M × 1`)
    expect(message).toContain('Client Essai')
  })

  test('commande directe : cette pièce seule, panier intact', async ({ page }) => {
    await page.goto(`/produit/${PIECE.slug}`)
    await page.getByRole('radio', { name: 'Taille L' }).click()
    await page.getByRole('button', { name: 'Commander · Paiement à la livraison' }).click()
    await expect(page).toHaveURL(/\/commande\?article=t-shirt-prada-graffiti/)
    await expect(page.getByText(PIECE.nom).first()).toBeVisible()
    await page.goto('/panier')
    await expect(page.getByText('Votre panier est vide')).toBeVisible()
  })

  test('recherche : suggestions puis page de résultats', async ({ page, isMobile }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Rechercher' }).click()
    const panneau = page.getByRole('dialog', { name: 'Recherche' })
    await panneau.getByRole('searchbox').or(panneau.getByLabel('Rechercher une pièce, une marque, un coloris')).fill('prada')
    await expect(panneau.getByText(PIECE.nom).first()).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/recherche\?q=prada/)
    test.info().annotations.push({ type: 'largeur', description: isMobile ? 'mobile' : 'ordinateur' })
  })
})

test.describe('menu principal', () => {
  const LIENS = ['Accueil', 'Boutique', 'Hommes', 'Femmes', 'Soldes']

  test('un seul lien souligné, celui de la page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'menu en ligne dès 1024 px ; le menu mobile est testé à part')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    for (const nom of LIENS) {
      await nav.getByRole('link', { name: nom, exact: true }).click()
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
      await expect(nav.locator('[aria-current="page"]')).toHaveText(nom)
    }
  })

  test('menu mobile : ouvre, navigue, se ferme', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'burger seulement sous 1024 px')
    await page.goto('/')
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: 'Hommes', exact: true }).click()
    await expect(page).toHaveURL(/genre=homme/)
    await expect(menu).toBeHidden()
  })

  test('aucun débordement horizontal sur les pages principales', async ({ page }) => {
    for (const url of ['/', '/boutique', `/produit/${PIECE.slug}`, '/panier', '/commande', '/connexion', '/contact', '/faq']) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(deborde, `débordement sur ${url}`).toBeLessThanOrEqual(0)
    }
  })
})
