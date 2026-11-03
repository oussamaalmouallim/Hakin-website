import { test as base, expect } from '@playwright/test'

/** Page prête pour les tests : intro sautée, `window.open` enregistré (lien WhatsApp),
 *  et garde-fou : toute requête vers Supabase fait échouer le test. */
export const test = base.extend<{ ouvertures: () => Promise<string[]> }>({
  page: async ({ page }, use) => {
    const fuites: string[] = []
    page.on('request', r => { if (/supabase\.(co|in)/.test(r.url())) fuites.push(r.url()) })
    await page.addInitScript(() => {
      sessionStorage.setItem('hmode-sans-intro', '1')
      const w = window as unknown as { __ouvertures: string[] }
      w.__ouvertures = []
      window.open = ((url?: string | URL) => { w.__ouvertures.push(String(url)); return null }) as typeof window.open
    })
    await use(page)
    expect(fuites, 'aucune requête vers Supabase pendant les tests').toEqual([])
  },
  ouvertures: async ({ page }, use) => {
    await use(() => page.evaluate(() => (window as unknown as { __ouvertures: string[] }).__ouvertures))
  },
})

export { expect }

/** Pièce avec prix et tailles de démo (`produits.demo.json`). */
export const PIECE = { slug: 't-shirt-prada-graffiti', nom: 'T-shirt Prada graffiti' }
