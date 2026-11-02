import { Link } from 'react-router-dom'
import { boutique } from '@/lib/catalogue'
import { useAnimations } from '@/state/animations'

const lienPied = 'text-gris no-underline transition-colors hover:text-encre'

/** cloneme: C-03 — pied de la référence : une ligne mono 11 px capitales (© · faits du centre en encre · liens).
 *  Ajout H MODE (Approximé) : une seconde ligne garde l'accès aux pages d'aide et légales, et le réglage des animations. */
export function PiedDePage() {
  const { animations, basculer } = useAnimations()
  const faits = [boutique.paiement, 'Commande WhatsApp', boutique.ville.split(',')[0]]
  return (
    <footer data-ref="pied" className="border-t border-ligne px-5 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-gris md:px-14 md:py-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} {boutique.nom}</span>
        <div className="hidden flex-1 text-center md:block">
          {faits.map((f, i) => (
            <span key={f}>{i > 0 && <span className="mx-3 opacity-50">·</span>}<span className="text-encre">{f}</span></span>
          ))}
        </div>
        <div className="flex gap-5">
          <Link to="/boutique" className={lienPied}>Boutique</Link>
          <Link to="/compte" className={lienPied}>Compte</Link>
          <a href={boutique.instagram.url} target="_blank" rel="noopener noreferrer" className={lienPied} aria-label="Instagram">IG</a>
          <a href={boutique.facebook.url} target="_blank" rel="noopener noreferrer" className={lienPied} aria-label="Facebook">FB</a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-ligne pt-4 text-[10px]">
        <Link to="/contact" className={lienPied}>Contact</Link>
        <Link to="/livraison-retours" className={lienPied}>Livraison & retours</Link>
        <Link to="/guide-des-tailles" className={lienPied}>Guide des tailles</Link>
        <Link to="/faq" className={lienPied}>FAQ</Link>
        <Link to="/maison" className={lienPied}>La Maison</Link>
        <Link to="/mentions-legales" className={lienPied}>Mentions légales</Link>
        <Link to="/confidentialite" className={lienPied}>Confidentialité</Link>
        <Link to="/cgv" className={lienPied}>CGV</Link>
        <button type="button" onClick={basculer} className={`${lienPied} uppercase tracking-[0.18em] md:ml-auto`} aria-pressed={!animations}>
          Animations : {animations ? 'activées' : 'désactivées'}
        </button>
      </div>
    </footer>
  )
}
