/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Projet Supabase : URL et clé publique (publishable). Jamais la clé secrète côté navigateur. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }

/** Version et date du build (vite.config.ts) : affichées dans la supervision, comparées à /version.json en ligne. */
declare const __VERSION__: string
declare const __CONSTRUIT_LE__: string
