import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, EyeOff, ImageOff, MessageCircle, Plus, Shirt, Tag } from 'lucide-react'
import { BoutonLien } from '@/design-system'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { formatDH } from '@/lib/format'
import { libelleStatut } from '@/lib/admin'
import { listerCommandes, listerDemandes, listerProduits } from './api'
import { CarteImport } from './ImportCatalogue'
import { CarteAdmin, EnTeteAdmin, ErreurAdmin, EtatVide, GrilleKpi, KpiCarte, Pastille, SqueletteAdmin, formatDate, useChargement } from './commun'

const lienCarte = 'inline-flex items-center gap-1 text-[12.5px] font-medium text-admin-info hover:underline'

export function TableauDeBord() {
  const donnees = useChargement(async () => {
    const [produits, commandes, demandes] = await Promise.all([listerProduits(), listerCommandes(), listerDemandes()])
    return { produits, commandes, demandes }
  })
  return (
    <>
      <EnTeteAdmin surtitre="Pilotage" titre="Tableau de bord" texte="L'état de la boutique en un coup d'œil. Chaque indicateur mène à la liste correspondante."
        actions={<BoutonLien to="/admin/produits/nouveau" variante="accent" icone={<Plus className="h-4 w-4" aria-hidden />}>Nouvelle pièce</BoutonLien>} />
      {donnees.erreur && <ErreurAdmin message={donnees.erreur} onReessayer={donnees.recharger} />}
      {donnees.enCours && !donnees.donnees && <SqueletteAdmin kpi={4} />}
      {donnees.donnees && (() => {
        const { produits, commandes, demandes } = donnees.donnees
        const sansPrix = produits.filter(p => p.prixDH === null).length
        const masques = produits.filter(p => !p.publie).length
        const sansPhoto = produits.filter(p => p.images.length === 0).length
        const nouvelles = commandes.filter(c => c.statut === 'nouvelle').length
        const aTraiter = demandes.filter(d => d.statut === 'a_traiter').length
        const visibles = produits.length - masques
        return (
          <div className="flex flex-col gap-5">
            {produits.length === 0 && <CarteImport onImporte={donnees.recharger} />}
            <GrilleKpi colonnes={5}>
              <KpiCarte Icone={Shirt} libelle="Pièces visibles" valeur={visibles} vers="/admin/produits"
                part={produits.length ? { valeur: visibles, max: produits.length, ton: 'encre' } : undefined} aide={`sur ${produits.length} au catalogue`} />
              <KpiCarte Icone={Tag} libelle="Sans prix" valeur={sansPrix} vers="/admin/produits?filtre=sans-prix" ton={sansPrix > 0 ? 'danger' : 'normal'} aide="affichées « Prix sur demande »" />
              <KpiCarte Icone={EyeOff} libelle="Masquées" valeur={masques} vers="/admin/produits?filtre=masques" />
              <KpiCarte Icone={ClipboardList} libelle="Commandes nouvelles" valeur={nouvelles} vers="/admin/commandes?statut=nouvelle" ton={nouvelles > 0 ? 'danger' : 'normal'} aide={`${commandes.length} au total`} />
              <KpiCarte Icone={MessageCircle} libelle="Demandes WhatsApp à traiter" valeur={aTraiter} vers="/admin/demandes" ton={aTraiter > 0 ? 'danger' : 'normal'} />
            </GrilleKpi>
            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <CarteAdmin titre="Dernières commandes" actions={<Link to="/admin/commandes" className={lienCarte}>Toutes les commandes<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}>
                {commandes.length === 0 ? <EtatVide Icone={ClipboardList} titre="Aucune commande pour le moment." texte="Les commandes passées sur le site arrivent ici, avec leur statut." /> : (
                  <Table minWidth={560}>
                    <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {commandes.slice(0, 6).map(c => (
                        <TableRow key={c.reference}>
                          <TableCell><Link to={`/admin/commandes?ref=${encodeURIComponent(c.reference)}`} className="font-mono text-[12px] font-medium hover:underline">{c.reference}</Link></TableCell>
                          <TableCell>{c.nom}<span className="block text-[12px] text-gris">{c.ville}</span></TableCell>
                          <TableCell className="whitespace-nowrap text-gris">{formatDate(c.cree_le)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{formatDH(c.sous_total_dh)}</TableCell>
                          <TableCell><Pastille point ton={c.statut === 'nouvelle' ? 'accent' : c.statut === 'annulee' ? 'danger' : c.statut === 'livree' ? 'succes' : 'neutre'}>{libelleStatut(c.statut)}</Pastille></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CarteAdmin>
              <CarteAdmin titre="À compléter dans le catalogue" texte="Ce qui manque aux fiches, lu dans la base.">
                <ul className="flex flex-col divide-y divide-ligne">
                  {[
                    { Icone: Tag, l: 'Pièces sans prix', n: sansPrix, vers: '/admin/produits?filtre=sans-prix' },
                    { Icone: ImageOff, l: 'Pièces sans photo', n: sansPhoto, vers: '/admin/produits' },
                    { Icone: EyeOff, l: 'Pièces masquées', n: masques, vers: '/admin/produits?filtre=masques' },
                  ].map(x => (
                    <li key={x.l}>
                      <Link to={x.vers} className="group flex items-center gap-3 py-3 first:pt-0">
                        <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-ligne bg-fond text-gris"><x.Icone className="h-4 w-4" aria-hidden /></span>
                        <span className="flex-1 text-[13px]">{x.l}</span>
                        <Pastille ton={x.n > 0 ? 'alerte' : 'succes'}>{x.n}</Pastille>
                        <ArrowRight className="h-4 w-4 text-gris-clair group-hover:text-encre" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CarteAdmin>
            </div>
          </div>
        )
      })()}
    </>
  )
}
