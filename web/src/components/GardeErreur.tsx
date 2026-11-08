import { Component, type ErrorInfo, type ReactNode } from 'react'
import { estErreurDeChargement, signalerErreur } from '@/lib/supervision'

/** Filet de sécurité : une erreur pendant l'affichage d'une page ne laisse plus un écran blanc.
 *  Elle est envoyée à la supervision, et le visiteur peut recharger. Une page devenue introuvable après une mise
 *  en ligne (ancien fichier) se recharge d'elle-même, une seule fois. */
export class GardeErreur extends Component<{ children: ReactNode }, { erreur: Error | null }> {
  state = { erreur: null as Error | null }

  static getDerivedStateFromError(erreur: Error) { return { erreur } }

  componentDidCatch(erreur: Error, info: ErrorInfo) {
    const chargement = estErreurDeChargement(erreur)
    signalerErreur(chargement ? 'chargement' : 'rendu', erreur.message, { source: (info.componentStack ?? '').trim().split('\n')[0]?.trim() ?? '' })
    if (chargement) {
      try {
        if (!sessionStorage.getItem('hmode-recharge')) { sessionStorage.setItem('hmode-recharge', '1'); location.reload() }
      } catch { /* stockage indisponible : le bouton reste */ }
    }
  }

  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-fond px-6 text-center">
        <div className="max-w-md">
          <p className="titre-2">Un problème est survenu</p>
          <p className="mt-4 text-gris">La page n'a pas pu s'afficher. Rechargez-la ; si cela continue, écrivez-nous sur WhatsApp.</p>
          <button type="button" onClick={() => { try { sessionStorage.removeItem('hmode-recharge') } catch { /* rien */ } location.reload() }}
            className="mt-8 rounded-full bg-encre px-8 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fond">
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
