import { useState } from 'react'
import { DatabaseZap } from 'lucide-react'
import { Bouton, useNotifier } from '@/design-system'
import { produitsFichier } from '@/lib/catalogue'
import { chargerDonnees } from '@/lib/donnees'
import { importerCatalogue } from './api'
import { CarteAdmin } from './commun'

/** Base encore vide : relie l'administration au catalogue actuel du site (les pièces de `src/data/produits.json`),
 *  en un clic. Affichée sur le tableau de bord et dans « Produits et prix ». */
export function CarteImport({ onImporte }: { onImporte: () => Promise<void> | void }) {
  const notifier = useNotifier()
  const [envoi, setEnvoi] = useState(false)
  const fichier = produitsFichier()
  const importer = async () => {
    setEnvoi(true)
    try {
      const n = await importerCatalogue(fichier)
      await onImporte()
      await chargerDonnees()
      notifier({ ton: 'succes', message: `${n} pièces importées dans la base.` })
    } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }) }
    finally { setEnvoi(false) }
  }
  return (
    <CarteAdmin titre="Catalogue pas encore en base" texte="Le site affiche aujourd'hui les pièces livrées avec son code. Importez-les une fois pour les gérer ici.">
      <div className="flex flex-wrap items-center gap-4">
        <Bouton variante="accent" chargement={envoi} onClick={importer} icone={<DatabaseZap className="h-4 w-4" aria-hidden />}>Importer les {fichier.length} pièces</Bouton>
        <p className="text-[13px] text-gris">Prix, tailles et photos sont repris tels quels. Rien n'est inventé : les prix vides restent « Prix sur demande ».</p>
      </div>
    </CarteAdmin>
  )
}
