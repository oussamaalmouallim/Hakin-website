import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Bouton, IconeWhatsApp, Modale, Selection, useNotifier } from '@/design-system'
import { STATUTS, csvCommandes, filtrerCommandes, libelleStatut, numeroWhatsAppClient, type CommandeAdmin, type Statut } from '@/lib/admin'
import { formatDH } from '@/lib/format'
import { cn } from '@/lib/utils'
import { changerStatut, listerCommandes, supprimerCommande } from './api'
import { Chargement, Confirmation, EnTeteAdmin, ErreurAdmin, Pastille, formatDate, useChargement } from './commun'

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

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-80">
          <span className="sr-only">Rechercher une commande</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Référence, client, téléphone…"
            className="w-full rounded-full border border-ligne-forte bg-blanc py-2.5 pl-11 pr-4 text-[14px] outline-none focus:border-encre" />
        </label>
        <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
          {[{ cle: 'toutes', libelle: 'Toutes' }, ...STATUTS].map(s => (
            <button key={s.cle} type="button" aria-pressed={statut === s.cle}
              onClick={() => setSp(x => { if (s.cle === 'toutes') x.delete('statut'); else x.set('statut', s.cle); return x }, { replace: true })}
              className={cn('rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                statut === s.cle ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-gris hover:border-encre hover:text-encre')}>
              {s.libelle}
            </button>
          ))}
        </div>
      </div>

      {liste.erreur && <ErreurAdmin message={liste.erreur} onReessayer={liste.recharger} />}
      {liste.enCours && !liste.donnees && <Chargement />}
      {liste.donnees && (visibles.length === 0 ? (
        <p className="rounded-carte bg-fond-2 p-8 text-center text-[14px] text-gris">{liste.donnees.length ? 'Aucune commande ne correspond.' : 'Aucune commande pour le moment.'}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.map(c => (
            <li key={c.reference}>
              <button type="button" onClick={() => ouvrir(c.reference)} aria-haspopup="dialog"
                className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-carte bg-fond-2 p-4 text-left transition-colors hover:bg-fond-3 md:grid-cols-[180px_1fr_140px_120px]">
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[12px] uppercase tracking-[0.1em]">{c.reference}</span>
                  <span className="text-[12px] text-gris">{formatDate(c.cree_le)}</span>
                </span>
                <span className="hidden min-w-0 md:block">
                  <span className="block truncate text-[14px]">{c.nom}</span>
                  <span className="block truncate text-[12px] text-gris">{c.ville} · {c.lignes_commande.reduce((n, l) => n + l.quantite, 0)} article(s)</span>
                </span>
                <span className="font-display text-[15px] tabular-nums md:text-right">{formatDH(c.sous_total_dh)}</span>
                <span className="col-span-2 md:col-span-1 md:justify-self-end"><Pastille ton={tonStatut(c.statut)}>{libelleStatut(c.statut)}</Pastille></span>
              </button>
            </li>
          ))}
        </ul>
      ))}

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
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-ligne-forte bg-blanc px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-encre hover:border-encre">
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
            <p className={cn(ligne, 'mt-2 border-t border-encre pt-3 font-display uppercase')}><span>Total</span><span className="tabular-nums">{formatDH(c.sous_total_dh)}</span></p>
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
