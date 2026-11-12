import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Download, Inbox, PackageCheck, RefreshCw, Search, Trash2, Truck } from 'lucide-react'
import { Bouton, IconeWhatsApp, Modale, Selection, useNotifier } from '@/design-system'
import { STATUTS, csvCommandes, filtrerCommandes, libelleStatut, numeroWhatsAppClient, type CommandeAdmin, type Statut } from '@/lib/admin'
import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'
import { changerStatut, listerCommandes, supprimerCommande } from './api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/lightswind/table'
import { ToggleGroup } from '@/components/lightswind/toggle-group'
import { CarteAdmin, Confirmation, EnTeteAdmin, ErreurAdmin, EtatVide, GrilleKpi, KpiCarte, Pastille, SqueletteAdmin, formatDate, useChargement } from './commun'

const tonStatut = (s: Statut): 'accent' | 'danger' | 'succes' | 'neutre' => (s === 'nouvelle' ? 'accent' : s === 'annulee' ? 'danger' : s === 'livree' ? 'succes' : 'neutre')

function telecharger(nom: string, contenu: string) {
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = nom
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Commandes() {
  const notifier = useNotifier()
  const [sp, setSp] = useSearchParams()
  const statut = (STATUTS.some(s => s.cle === sp.get('statut')) ? sp.get('statut') : 'toutes') as Statut | 'toutes'
  const ouverte = sp.get('ref')
  const [q, setQ] = useState('')
  const liste = useChargement(listerCommandes)
  const visibles = useMemo(() => filtrerCommandes(liste.donnees ?? [], q, statut), [liste.donnees, q, statut])
  const commande = liste.donnees?.find(c => c.reference === ouverte) ?? null

  const ouvrir = (ref: string | null) => setSp(s => { if (ref) s.set('ref', ref); else s.delete('ref'); return s }, { replace: !ref })
  const majLocale = (ref: string, maj: Partial<CommandeAdmin> | null) =>
    liste.donnees && liste.remplacer(maj ? liste.donnees.map(c => (c.reference === ref ? { ...c, ...maj } : c)) : liste.donnees.filter(c => c.reference !== ref))

  return (
    <>
      <EnTeteAdmin surtitre="Ventes" titre="Commandes"
        texte="Chaque commande passée sur le site, confirmée ensuite avec le client sur WhatsApp. Paiement à la livraison."
        actions={<>
          <Bouton variante="contour" taille="sm" icone={<RefreshCw className="h-3.5 w-3.5" aria-hidden />} chargement={liste.enCours} onClick={liste.recharger}>Actualiser</Bouton>
          <Bouton variante="contour" taille="sm" icone={<Download className="h-3.5 w-3.5" aria-hidden />} disabled={!visibles.length}
            onClick={() => telecharger(`commandes-hmode-${new Date().toISOString().slice(0, 10)}.csv`, csvCommandes(visibles))}>Exporter ({visibles.length})</Bouton>
        </>} />

      {liste.donnees && (
        <div className="mb-5">
          <GrilleKpi>
            <KpiCarte Icone={ClipboardList} libelle="Commandes" valeur={liste.donnees.length} />
            <KpiCarte Icone={Inbox} libelle="Nouvelles, à confirmer" valeur={liste.donnees.filter(c => c.statut === 'nouvelle').length} ton={liste.donnees.some(c => c.statut === 'nouvelle') ? 'danger' : 'normal'} />
            <KpiCarte Icone={Truck} libelle="Confirmées ou expédiées" valeur={liste.donnees.filter(c => c.statut === 'confirmee' || c.statut === 'expediee').length} />
            <KpiCarte Icone={PackageCheck} libelle="Montant des commandes livrées" valeur={formatDH(liste.donnees.filter(c => c.statut === 'livree').reduce((n, c) => n + c.sous_total_dh, 0))}
              aide={`${liste.donnees.filter(c => c.statut === 'livree').length} livrée(s)`} />
          </GrilleKpi>
        </div>
      )}

      <CarteAdmin sansMarge titre="Liste des commandes" actions={<ToggleGroup libelle="Filtrer par statut" masquerLibelle valeur={statut}
          options={[{ v: 'toutes' as Statut | 'toutes', l: 'Toutes' }, ...STATUTS.map(s => ({ v: s.cle as Statut | 'toutes', l: s.libelle }))]}
          onChange={v => setSp(x => { if (v === 'toutes') x.delete('statut'); else x.set('statut', v); return x }, { replace: true })} />}>
        <div className="px-5 pb-4">
          <label className="relative block md:w-80">
            <span className="sr-only">Rechercher une commande</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Référence, client, téléphone…"
              className="h-9 w-full rounded-bloc border border-ligne-forte bg-fond-2 pl-9 pr-3 text-[13px] outline-none focus:border-encre" />
          </label>
        </div>
        <div className="px-5 pb-5">
          {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
          {liste.enCours && !liste.donnees && <SqueletteAdmin kpi={0} />}
          {liste.donnees && (visibles.length === 0 ? (
            <EtatVide Icone={ClipboardList} titre={liste.donnees.length ? 'Aucune commande ne correspond.' : 'Aucune commande pour le moment.'} />
          ) : (
            <Table minWidth={720}>
              <TableHeader><TableRow className="hover:bg-transparent">
                <TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Articles</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {visibles.map(c => (
                  <TableRow key={c.reference} className="cursor-pointer" onClick={() => ouvrir(c.reference)}>
                    <TableCell>
                      <button type="button" onClick={e => { e.stopPropagation(); ouvrir(c.reference) }} aria-haspopup="dialog" aria-label={`${c.reference} — ${c.nom}, ${formatDH(c.sous_total_dh)}`} className="font-mono text-[12px] font-medium hover:underline">{c.reference}</button>
                      <span className="block text-[12px] text-gris">{formatDate(c.cree_le)}</span>
                    </TableCell>
                    <TableCell>{c.nom}<span className="block text-[12px] text-gris">{c.ville}</span></TableCell>
                    <TableCell className="tabular-nums text-gris">{c.lignes_commande.reduce((n, l) => n + l.quantite, 0)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatDH(c.sous_total_dh)}</TableCell>
                    <TableCell><Pastille ton={tonStatut(c.statut)} point>{libelleStatut(c.statut)}</Pastille></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
        </div>
      </CarteAdmin>

      {commande && <DetailCommande key={commande.reference} commande={commande} onFermer={() => ouvrir(null)}
        onStatut={async s => { await changerStatut(commande.reference, s); majLocale(commande.reference, { statut: s }); notifier({ ton: 'succes', message: `Statut : ${libelleStatut(s)}.` }) }}
        onSupprimer={async () => { await supprimerCommande(commande.reference); majLocale(commande.reference, null); ouvrir(null); notifier({ ton: 'succes', message: 'Commande supprimée.' }) }} />}
    </>
  )
}

function DetailCommande({ commande: c, onFermer, onStatut, onSupprimer }: {
  commande: CommandeAdmin; onFermer: () => void; onStatut: (s: Statut) => Promise<void>; onSupprimer: () => Promise<void>
}) {
  const notifier = useNotifier()
  const [statut, setStatut] = useState<Statut>(c.statut)
  const [envoi, setEnvoi] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const numero = numeroWhatsAppClient(c.telephone)
  const message = `Bonjour ${c.nom.split(' ')[0]}, c'est H MODE au sujet de votre commande ${c.reference}.`
  const ligne = 'flex justify-between gap-4 py-1.5 text-[14px]'

  return (
    <>
      <Modale ouvert={!confirmer} onFermer={onFermer} titre={`Commande ${c.reference}`} large>
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h3 className="label mb-3 text-gris">Client</h3>
            <p className="text-[15px]">{c.nom}</p>
            <p className="text-[14px] text-gris">{c.telephone}{c.email ? ` · ${c.email}` : ''}</p>
            <p className="mt-3 text-[14px]">{c.adresse}, {c.ville}</p>
            {c.instructions && <p className="mt-2 text-[13px] text-gris">« {c.instructions} »</p>}
            {numero && (
              <a href={`https://wa.me/${numero}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-bloc border border-ligne-forte bg-fond-2 px-3.5 text-[13px] font-medium text-encre hover:border-encre">
                <IconeWhatsApp className="h-4 w-4 text-whatsapp" />Écrire au client
              </a>
            )}
            <p className="mt-5 text-[12px] text-gris">Passée le {formatDate(c.cree_le)} · paiement à la livraison</p>
          </section>
          <section>
            <h3 className="label mb-3 text-gris">Articles</h3>
            <ul className="divide-y divide-ligne">
              {c.lignes_commande.map((l, i) => (
                <li key={i} className={ligne}>
                  <span className="min-w-0"><span className="block">{l.nom}</span><span className="text-[12px] text-gris">{l.coloris} · taille {l.taille} · × {l.quantite}</span></span>
                  <span className="shrink-0 tabular-nums">{formatDH(l.prix_dh * l.quantite)}</span>
                </li>
              ))}
            </ul>
            <p className={cn(ligne, 'mt-2 border-t border-ligne-forte pt-3 font-semibold')}><span>Total</span><span className="tabular-nums">{formatDH(c.sous_total_dh)}</span></p>
          </section>
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-ligne pt-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-3">
            <div className="w-52"><Selection label="Statut" value={statut} onChange={e => setStatut(e.target.value as Statut)}>
              {STATUTS.map(s => <option key={s.cle} value={s.cle}>{s.libelle}</option>)}
            </Selection></div>
            <Bouton className="mb-0.5" chargement={envoi} disabled={statut === c.statut}
              onClick={async () => { setEnvoi(true); try { await onStatut(statut) } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }) } finally { setEnvoi(false) } }}>
              Enregistrer le statut
            </Bouton>
          </div>
          <Bouton variante="texte" className="text-danger" icone={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => setConfirmer(true)}>Supprimer la commande</Bouton>
        </div>
      </Modale>
      <Confirmation ouvert={confirmer} titre="Supprimer cette commande ?" libelle="Supprimer définitivement" onFermer={() => setConfirmer(false)}
        texte={<p>La commande {c.reference} de {c.nom} sera effacée de la base, avec ses articles. À réserver aux commandes de test ou en double. Cette action ne peut pas être annulée.</p>}
        onConfirmer={async () => { try { await onSupprimer() } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }); setConfirmer(false) } }} />
    </>
  )
}
