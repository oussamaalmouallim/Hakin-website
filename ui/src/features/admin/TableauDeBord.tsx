import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { formatDH } from '@/lib/format'
import { libelleStatut } from '@/lib/admin'
import { listerCommandes, listerProduits } from './api'
import { CarteImport } from './ImportCatalogue'
import { CarteAdmin, Chargement, EnTeteAdmin, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'

function Chiffre({ valeur, libelle, vers, alerte }: { valeur: number; libelle: string; vers: string; alerte?: boolean }) {
  return (
    <Link to={vers} className="group flex flex-col justify-between gap-6 rounded-carte bg-fond-2 p-5 transition-colors hover:bg-fond-3">
      <span className={alerte && valeur > 0 ? 'font-display text-[34px] leading-none text-danger' : 'font-display text-[34px] leading-none'}>{valeur}</span>
      <span className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gris group-hover:text-encre">
        {libelle}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  )
}

export function TableauDeBord() {
  const donnees = useChargement(async () => {
    const [produits, commandes] = await Promise.all([listerProduits(), listerCommandes()])
    return { produits, commandes }
  })
  return (
    <>
      <EnTeteAdmin surtitre="Administration" titre="Tableau de bord" texte="L'état de la boutique en un coup d'œil. Chaque chiffre mène à la liste correspondante." />
      {donnees.erreur && <ErreurAdmin message={donnees.erreur} onReessayer={donnees.recharger} />}
      {donnees.enCours && !donnees.donnees && <Chargement />}
      {donnees.donnees && (() => {
        const { produits, commandes } = donnees.donnees
        const sansPrix = produits.filter(p => p.prixDH === null).length
        const masques = produits.filter(p => !p.publie).length
        const nouvelles = commandes.filter(c => c.statut === 'nouvelle').length
        return (
          <div className="flex flex-col gap-6">
            {produits.length === 0 && <CarteImport onImporte={donnees.recharger} />}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Chiffre valeur={produits.length - masques} libelle="Pièces visibles" vers="/admin/produits" />
              <Chiffre valeur={sansPrix} libelle="Sans prix" vers="/admin/produits?filtre=sans-prix" alerte />
              <Chiffre valeur={masques} libelle="Masquées" vers="/admin/produits?filtre=masques" />
              <Chiffre valeur={nouvelles} libelle="Commandes nouvelles" vers="/admin/commandes?statut=nouvelle" alerte />
            </div>
            <CarteAdmin titre="Dernières commandes" actions={<Link to="/admin/commandes" className="label text-encre underline underline-offset-4">Toutes les commandes</Link>}>
              {commandes.length === 0 ? <p className="text-[14px] text-gris">Aucune commande pour le moment.</p> : (
                <ul className="divide-y divide-ligne">
                  {commandes.slice(0, 5).map(c => (
                    <li key={c.reference}>
                      <Link to={`/admin/commandes?ref=${encodeURIComponent(c.reference)}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-encre">
                        <span className="min-w-0">
                          <span className="block font-mono text-[12px] uppercase tracking-[0.1em]">{c.reference}</span>
                          <span className="text-[13px] text-gris">{c.nom} · {formatDate(c.cree_le)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-display text-[15px] tabular-nums">{formatDH(c.sous_total_dh)}</span>
                          <Pastille ton={c.statut === 'nouvelle' ? 'accent' : c.statut === 'annulee' ? 'danger' : 'neutre'}>{libelleStatut(c.statut)}</Pastille>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CarteAdmin>
          </div>
        )
      })()}
    </>
  )
}
