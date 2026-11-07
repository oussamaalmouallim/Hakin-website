import reels from '../../src/data/produits.json'
import prixTest from './prix-test.json'

/** Catalogue des tests navigateur : le vrai `produits.json`, plus des prix et tailles d'ESSAI sur quelques pièces
 *  (`prix-test.json`) pour pouvoir tester panier et commande. Jamais chargé par le site : seulement en `vite --mode e2e`. */
const essai = prixTest as Record<string, Record<string, unknown>>
export default reels.map(p => (essai[p.slug] ? { ...p, ...essai[p.slug] } : p))
