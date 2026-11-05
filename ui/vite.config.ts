/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const chemin = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [react()],
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
