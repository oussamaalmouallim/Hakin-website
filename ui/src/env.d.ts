/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO?: string
  /** Projet Supabase : URL et clé publique (publishable). Jamais la clé secrète côté navigateur. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
