import { readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/** Parcours de l'administration dans un vrai navigateur, sur le Supabase LOCAL (jamais le projet en ligne).
 *  Prérequis : `npx supabase start` à la racine. Serveur de test 6014 en mode `supabase-local`, lancé puis arrêté par Playwright.
 *  `preparation.ts` crée un compte neuf, confirme son e-mail (Mailpit) et le nomme admin en SQL ; `rangement.ts` retire ses droits. */
const env = Object.fromEntries(readFileSync('.env.supabase-local', 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
if (!/127\.0\.0\.1|localhost/.test(env.VITE_SUPABASE_URL ?? '')) throw new Error('Refusé : la suite admin ne tourne que sur un Supabase local.')
process.env.ADMIN_SUPABASE_URL = env.VITE_SUPABASE_URL
process.env.ADMIN_SUPABASE_CLE = env.VITE_SUPABASE_PUBLISHABLE_KEY
const PORT = 6014

export default defineConfig({
  testDir: './e2e/admin',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'rapports/playwright-admin' }]],
  outputDir: 'rapports/playwright-admin-resultats',
  globalSetup: './e2e/admin/preparation.ts',
  globalTeardown: './e2e/admin/rangement.ts',
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', locale: 'fr-FR', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  webServer: { command: `npx vite --mode supabase-local --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: false },
})
