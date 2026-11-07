import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { FICHIER_COMPTE } from './preparation'

/** Parcours réel de l'administration, de bout en bout, sur le Supabase local :
 *  connexion admin → pièce créée avec photo (stockage) → visible sur le site → mise en solde → commandée par un client
 *  au prix de la base → statut changé → journal → pièce supprimée. */
const compte = () => JSON.parse(readFileSync(FICHIER_COMPTE, 'utf8')) as { email: string; motDePasse: string; suffixe: string }

async function seConnecter(page: Page) {
  const { email, motDePasse } = compte()
  await page.addInitScript(() => {
    sessionStorage.setItem('hmode-sans-intro', '1')
    window.open = (() => null) as typeof window.open
  })
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/connexion\?retour=%2Fadmin/)
  const f = page.getByRole('form', { name: 'Connexion' })
  await f.getByRole('textbox', { name: 'Adresse email' }).fill(email)
  await f.getByLabel('Mot de passe', { exact: true }).fill(motDePasse)
  await f.locator('button[type=submit]').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible()
}

test('administration : de la création d\'une pièce à sa commande par un client', async ({ page }) => {
  const { suffixe } = compte()
  const passage = Date.now().toString(36) // unique à chaque passage (--repeat-each) : pièce, journal et commande à part
  const nom = `Veste essai e2e ${suffixe} ${passage}`
  const slug = `veste-essai-e2e-${suffixe}-${passage}`
  const client = `Client E2E ${passage}`
  await seConnecter(page)

  // Catalogue encore vide dans cette base : import (sinon la carte d'import n'apparaît pas).
  const importer = page.getByRole('button', { name: /^Importer les \d+ pièces$/ })
  if (await importer.isVisible()) { await importer.click(); await expect(page.getByText(/pièces importées dans la base/)).toBeVisible() }

  // ── Création, avec une vraie photo envoyée au stockage ─────────────────────────────────────────
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Produits et prix' }).click()
  await page.getByRole('link', { name: 'Nouvelle pièce' }).click()
  await page.getByLabel('Nom', { exact: true }).fill(nom)
  await expect(page.getByLabel('Adresse de la page')).toHaveValue(slug)
  await page.getByLabel('Type').selectOption('vestes')
  await page.getByLabel('Prix de vente (DH)').fill('450')
  await page.getByRole('button', { name: 'XS à XXL' }).click()
  await page.getByRole('button', { name: 'Ajouter un coloris' }).click()
  await page.getByRole('textbox', { name: 'Coloris 1', exact: true }).fill('noir')
  const photo = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 30, g: 30, b: 30 } } }).png().toBuffer()
  await page.locator('#ajout-photos').setInputFiles({ name: 'veste.png', mimeType: 'image/png', buffer: photo })
  await expect(page.getByText('Principale')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('switch', { name: 'Visible sur le site' }).click()
  await page.getByRole('button', { name: 'Créer la pièce' }).click()
  await expect(page.getByText('Pièce créée.')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/admin/produits/${slug}$`))

  // ── Sur le site : prix de la base, photo servie par le stockage ───────────────────────────────
  await page.goto(`/produit/${slug}`)
  await expect(page.getByRole('heading', { level: 1, name: nom })).toBeVisible()
  await expect(page.getByText('450 DH').first()).toBeVisible()
  const image = page.locator(`img[src*="/storage/v1/object/public/produits/${slug}/"]`).first()
  await expect(image).toBeVisible()
  expect(await image.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0)

  // ── Mise en solde depuis l'admin, visible dans « Soldes » ─────────────────────────────────────
  await page.goto(`/admin/produits/${slug}`)
  await page.getByLabel('Prix de vente (DH)').fill('400')
  await page.getByLabel(/Ancien prix/).fill('500')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Modifications enregistrées.')).toBeVisible()
  await page.goto('/boutique?solde=1')
  await expect(page.getByText(nom).first()).toBeVisible()

  // ── Un client la commande : le total vient de la base (400 DH) ────────────────────────────────
  await page.goto(`/produit/${slug}`)
  await page.getByRole('radio', { name: 'Taille M' }).click()
  await page.getByRole('button', { name: 'Commander · Paiement à la livraison' }).click()
  await page.getByRole('textbox', { name: 'Nom complet' }).fill(client)
  await page.getByRole('textbox', { name: 'Téléphone (WhatsApp)' }).fill('0612345678')
  await page.getByRole('combobox', { name: 'Ville' }).selectOption('Casablanca')
  await page.getByRole('textbox', { name: 'Adresse', exact: true }).fill('12 rue de l\'essai')
  await page.getByRole('checkbox', { name: /J'accepte les conditions/ }).check()
  await page.getByRole('button', { name: 'Passer la commande' }).click()
  await expect(page.getByRole('heading', { name: 'Commande enregistrée' })).toBeVisible({ timeout: 15_000 })

  // ── L'admin la retrouve, change son statut ────────────────────────────────────────────────────
  await page.goto('/admin/commandes')
  await page.getByPlaceholder('Référence, client, téléphone…').fill(client)
  await page.getByRole('button', { name: new RegExp(client) }).click()
  const fenetre = page.getByRole('dialog', { name: /^Commande / })
  await expect(fenetre.getByText('400 DH').first()).toBeVisible()
  await fenetre.getByLabel('Statut').selectOption('confirmee')
  await fenetre.getByRole('button', { name: 'Enregistrer le statut' }).click()
  await expect(page.getByText('Statut : Confirmée.')).toBeVisible()
  await page.keyboard.press('Escape')

  // ── Journal : chaque étape, avec son auteur ───────────────────────────────────────────────────
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Journal' }).click()
  const entreesPiece = page.locator('li', { has: page.getByRole('link', { name: slug, exact: true }) })
  await expect(entreesPiece.filter({ hasText: 'prix : 450 → 400 · ancien prix : vide → 500' })).toHaveCount(1)
  await expect(entreesPiece.filter({ hasText: 'produit créé' })).toHaveCount(1)
  await expect(page.getByText('Nouvelle → Confirmée').first()).toBeVisible()

  // ── Suppression : la pièce disparaît du site ──────────────────────────────────────────────────
  await page.goto(`/admin/produits/${slug}`)
  await page.getByRole('button', { name: 'Supprimer la pièce' }).click()
  await page.getByRole('dialog', { name: 'Supprimer cette pièce ?' }).getByRole('button', { name: 'Supprimer définitivement' }).click()
  await expect(page.getByText('Pièce supprimée.')).toBeVisible()
  await page.goto(`/produit/${slug}`)
  await expect(page.getByRole('heading', { level: 1, name: nom })).toHaveCount(0)
})

test('accessibilité WCAG 2.2 AA de chaque écran de l\'administration (axe)', async ({ page }) => {
  await seConnecter(page)
  for (const ecran of ['/admin', '/admin/produits', '/admin/produits/nouveau', '/admin/produits/t-shirt-prada-graffiti', '/admin/commandes', '/admin/reglages', '/admin/textes', '/admin/journal']) {
    await page.goto(ecran)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    const graves = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      .map(v => `${ecran} ${v.id} ×${v.nodes.length} : ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
    expect(graves).toEqual([])
  }
})

test('compte client sans droits : l\'administration reste fermée', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('hmode-sans-intro', '1'))
  await page.goto('/admin/commandes')
  await expect(page).toHaveURL(/\/connexion/)
})
