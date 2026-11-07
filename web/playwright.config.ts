import { defineConfig, devices } from '@playwright/test'

/** Tests de bout en bout dans un vrai navigateur.
 *  Serveur propre aux tests sur 6014, lancé puis arrêté par Playwright : mode `e2e` (prix d'essai de `e2e/donnees/`), clés Supabase vidées
 *  (les variables déjà présentes priment sur `web/.env`), donc parcours WhatsApp seul et aucune écriture en base.
 *  Le 6013 n'est ni utilisé ni touché. */
const PORT = 6014

export default defineConfig({
  testDir: './e2e',
  // L'administration a sa propre suite, sur Supabase local : playwright.admin.config.ts (npm run test:e2e:admin).
  testIgnore: 'admin/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'rapports/playwright' }]],
  outputDir: 'rapports/playwright-resultats',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', locale: 'fr-FR' },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --mode e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
})
