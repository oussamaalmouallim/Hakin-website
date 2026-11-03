/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true, port: 6013, strictPort: true },
  preview: { port: 6013 },
  // Tests : jamais le vrai projet Supabase (le client est simulé dans les tests qui en ont besoin).
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', css: false, exclude: [...configDefaults.exclude, 'e2e/**'], env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' } },
})
