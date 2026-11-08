/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

const chemin = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/** Version gravée au build : commit fourni par l'hébergeur (Netlify : COMMIT_REF, GitHub : GITHUB_SHA, Docker : VERSION_SITE),
 *  sinon le commit local, sinon « local ». Publiée aussi dans /version.json, lue par la supervision et le robot. */
function versionDuSite() {
  const fournie = process.env.VERSION_SITE || process.env.COMMIT_REF || process.env.GITHUB_SHA
  if (fournie) return fournie.slice(0, 12)
  try { return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return 'local' }
}
const VERSION = versionDuSite()
const CONSTRUIT_LE = new Date().toISOString()

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: 'hmode-version',
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION, construit_le: CONSTRUIT_LE }) + '\n' }) },
    // Même fichier en développement, pour que la supervision et le robot se comportent comme en ligne.
    configureServer(serveur) {
      serveur.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-cache')
        res.end(JSON.stringify({ version: VERSION, construit_le: CONSTRUIT_LE }))
      })
    },
  }],
  define: { __VERSION__: JSON.stringify(VERSION), __CONSTRUIT_LE__: JSON.stringify(CONSTRUIT_LE) },
  resolve: {
    alias: [
      // Tests navigateur seulement (`vite --mode e2e`, lancé par Playwright) : catalogue réel + prix d'essai de `e2e/donnees/`.
      // Le site lui-même n'a aucune donnée fictive.
      ...(mode === 'e2e' ? [{ find: /^@\/data\/produits\.json$/, replacement: chemin('./e2e/donnees/produits-test.ts') }] : []),
      { find: '@', replacement: chemin('./src') },
    ],
  },
  server: { host: true, port: 6013, strictPort: true },
  preview: { port: 6013 },
  // Tests : jamais le vrai projet Supabase (le client est simulé dans les tests qui en ont besoin).
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', css: false, exclude: [...configDefaults.exclude, 'e2e/**'], env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' } },
}))
