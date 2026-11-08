import { obtenirSupabase, supabaseActif } from '@/lib/supabase'

/** Supervision côté visiteur (lot C) : erreurs du site et pages vues, envoyées à la base par des fonctions limitées
 *  (`signaler_erreur`, `compter_visite`). Rien de personnel : la page sans paramètres, un message d'erreur nettoyé
 *  (e-mails, numéros, jetons retirés ici puis encore en base), la famille du navigateur. Ni cookie, ni identifiant :
 *  la base calcule une empreinte hachée de l'adresse réseau, jamais gardée en clair. */

export type TypeErreur = 'script' | 'promesse' | 'rendu' | 'api' | 'chargement'
export const VERSION_SITE = typeof __VERSION__ === 'string' ? __VERSION__ : 'local'
export const CONSTRUIT_LE = typeof __CONSTRUIT_LE__ === 'string' ? __CONSTRUIT_LE__ : ''

const MAX_PAR_PAGE = 10
const dejaEnvoyees = new Set<string>()

/** Retire ce qui pourrait identifier quelqu'un avant tout envoi. */
export function nettoyer(texte: string, n: number) {
  return texte
    .replace(/[^\s@]+@[^\s@]+/g, '[e-mail]')
    .replace(/[A-Za-z0-9_\-.]{32,}/g, '[jeton]')
    .replace(/\+?\d[\d .-]{7,}\d/g, '[numéro]')
    .replace(/\?\S*/g, '')
    .slice(0, n)
}

export function familleNavigateur(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  const nav = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Instagram/.test(ua) ? 'Instagram' : /FBAN|FBAV/.test(ua) ? 'Facebook'
    : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Autre'
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : ''
  return [nav, os].filter(Boolean).join(' · ')
}

const pageCourante = () => (typeof location === 'undefined' ? '' : location.pathname)

/** Envoie une erreur à la supervision (au plus 10 par page, sans doublon). N'échoue jamais. */
export function signalerErreur(type: TypeErreur, message: string, options: { gravite?: 'erreur' | 'avertissement'; source?: string } = {}) {
  if (!supabaseActif || !message) return
  const propre = nettoyer(message, 500)
  const cle = `${type}|${propre}`
  if (dejaEnvoyees.has(cle) || dejaEnvoyees.size >= MAX_PAR_PAGE) return
  dejaEnvoyees.add(cle)
  void obtenirSupabase().then(sb => sb?.rpc('signaler_erreur', { erreur: {
    type, gravite: options.gravite ?? 'erreur', message: propre, page: nettoyer(pageCourante(), 200),
    source: nettoyer(options.source ?? '', 200), version: VERSION_SITE, navigateur: familleNavigateur(),
  } })).catch(() => undefined)
}

/** Erreur de chargement d'un fichier du site (souvent : ancienne page ouverte après une mise en ligne). */
export const estErreurDeChargement = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(String((e as Error)?.message ?? e))

let installee = false
/** Écoute les erreurs non attrapées du navigateur. Appelée une fois, au démarrage. */
export function installerSurveillance() {
  if (installee || !supabaseActif || typeof window === 'undefined') return
  installee = true
  window.addEventListener('error', e => {
    // Ressource introuvable (image, script) : l'événement n'a pas de message, la cible dit laquelle.
    const cible = e.target as HTMLElement | null
    if (cible && cible !== (window as unknown as HTMLElement) && 'src' in cible) {
      signalerErreur('chargement', `Ressource introuvable : ${(cible as HTMLImageElement).src.replace(location.origin, '')}`, { gravite: 'avertissement' })
      return
    }
    signalerErreur(estErreurDeChargement(e.error) ? 'chargement' : 'script', e.message || String(e.error), { source: `${(e.filename || '').replace(location.origin, '')}:${e.lineno}` })
  }, true)
  window.addEventListener('unhandledrejection', e => {
    const raison = e.reason as Error | undefined
    signalerErreur(estErreurDeChargement(raison) ? 'chargement' : 'promesse', String(raison?.message ?? raison ?? 'Promesse rejetée'))
  })
}

// ── Pages vues ────────────────────────────────────────────────────────────────────────────────────
let lcp: number | null = null
let premiere = true
if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
  try {
    new PerformanceObserver(liste => {
      const e = liste.getEntries().at(-1)
      if (e) lcp = Math.round(e.startTime)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* navigateur sans cette mesure */ }
}

/** Compte une page vue (hors administration). La première attend 4 s pour joindre le temps d'affichage (LCP). */
export function compterVisite(page: string) {
  if (!supabaseActif || page.startsWith('/admin')) return
  const envoyer = (avecLcp: boolean) => void obtenirSupabase()
    .then(sb => sb?.rpc('compter_visite', { page: nettoyer(page, 200), lcp_ms: avecLcp ? lcp : null }))
    .catch(() => undefined)
  if (premiere) { premiere = false; window.setTimeout(() => envoyer(true), 4000) } else envoyer(false)
}
