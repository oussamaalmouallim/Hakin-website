import AxeBuilder from '@axe-core/playwright'
import { test, expect, PIECE } from './outils'

/** Contrôle automatique WCAG 2.1 A et AA (axe-core) : aucune violation grave ou critique.
 *  Contraste : seul le gris de la référence (`--gris` #8a8a8a, Relevé sur Original Fit, 3,1:1 sur le fond) est toléré
 *  tant que la décision de le foncer n'est pas prise. Toute autre couleur trop pâle fait échouer le test.
 *  `[data-decoratif]` (panneau illustratif de /connexion, `aria-hidden`, filigrane voulu à 6 %) est exclu : texte décoratif, hors WCAG 1.4.3. */
const PAGES = ['/', '/boutique', '/boutique?genre=femme', `/produit/${PIECE.slug}`, '/panier', '/commande', '/connexion', '/recherche?q=prada', '/contact', '/faq', '/page-inexistante']
const GRIS_REFERENCE = '#8a8a8a'

for (const url of PAGES) {
  test(`axe : ${url}`, async ({ page }) => {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(900) // fin des entrées animées
    const { violations } = await new AxeBuilder({ page }).exclude('[data-decoratif]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    const graves = violations
      .filter(v => v.impact === 'serious' || v.impact === 'critical')
      .map(v => v.id === 'color-contrast'
        ? { ...v, nodes: v.nodes.filter(n => (n.any[0]?.data as { fgColor?: string } | undefined)?.fgColor !== GRIS_REFERENCE) }
        : v)
      .filter(v => v.nodes.length)
    const resume = graves.map(v => `${v.id} (${v.impact}) ×${v.nodes.length} : ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
    expect(resume).toEqual([])
  })
}
