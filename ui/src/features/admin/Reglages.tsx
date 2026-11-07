import { useEffect, useMemo, useState } from 'react'
import { Bouton, Champ, ZoneTexte, useNotifier } from '@/design-system'
import { boutiqueFichier } from '@/lib/catalogue'
import { chargerDonnees } from '@/lib/donnees'
import { fusionnerBoutique } from '@/lib/produitsBase'
import { validerReglages, type ErreursReglages } from '@/lib/admin'
import type { Boutique } from '@/lib/types'
import { enregistrerReglage, lireReglages } from './api'
import { CarteAdmin, Chargement, EnTeteAdmin, ErreurAdmin, useAvertirSiModifie, useChargement } from './commun'

const vide = (v: string) => (v.trim() ? v.trim() : null)

export function Reglages() {
  const notifier = useNotifier()
  const chargement = useChargement(async () => fusionnerBoutique(boutiqueFichier(), (await lireReglages()).boutique))
  const [b, setB] = useState<Boutique | null>(null)
  const [erreurs, setErreurs] = useState<ErreursReglages>({})
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { if (chargement.donnees) setB(structuredClone(chargement.donnees)) }, [chargement.donnees])
  const modifie = useMemo(() => !!b && JSON.stringify(b) !== JSON.stringify(chargement.donnees), [b, chargement.donnees])
  useAvertirSiModifie(modifie)

  if (chargement.erreur) return <><EnTeteAdmin surtitre="Boutique" titre="Réglages" /><ErreurAdmin message={chargement.erreur} onReessayer={chargement.recharger} /></>
  if (!b) return <Chargement />
  const maj = (f: (x: Boutique) => Boutique, cle?: keyof ErreursReglages) => { setB(x => (x ? f(structuredClone(x)) : x)); if (cle) setErreurs(e => ({ ...e, [cle]: undefined })) }

  const enregistrer = async () => {
    const e = validerReglages(b)
    setErreurs(e)
    if (Object.values(e).some(Boolean)) { notifier({ ton: 'erreur', message: 'Corrigez les champs signalés en rouge.' }); return }
    setEnvoi(true)
    try {
      const { paiement: _paiement, ...valeur } = b
      await enregistrerReglage('boutique', valeur)
      chargement.remplacer(structuredClone(b))
      void chargerDonnees()
      notifier({ ton: 'succes', message: 'Réglages enregistrés : le site est à jour.' })
    } catch (err) { notifier({ ton: 'erreur', message: (err as Error).message }) }
    finally { setEnvoi(false) }
  }

  return (
    <>
      <EnTeteAdmin surtitre="Boutique" titre="Réglages"
        texte="Coordonnées, réseaux, livraison et retours, tels qu'ils s'affichent sur le site. Un champ vide s'affiche « À confirmer »." />
      <form noValidate aria-label="Réglages de la boutique" onSubmit={e => { e.preventDefault(); void enregistrer() }} className="flex flex-col gap-6 pb-10">
        <CarteAdmin titre="Contact et WhatsApp" texte="Le numéro reçoit toutes les commandes du site.">
          <div className="grid gap-5 md:grid-cols-2">
            <Champ label="Numéro WhatsApp (international, chiffres)" inputMode="numeric" value={b.whatsapp} erreur={erreurs.whatsapp} aide="Exemple : 212612345678"
              onChange={e => maj(x => ({ ...x, whatsapp: e.target.value.replace(/\D/g, '') }), 'whatsapp')} />
            <Champ label="Numéro affiché" value={b.whatsappAffiche} onChange={e => maj(x => ({ ...x, whatsappAffiche: e.target.value }))} aide="Exemple : +212 6 12 34 56 78" />
            <Champ label="Ville" value={b.ville} onChange={e => maj(x => ({ ...x, ville: e.target.value }))} />
            <Champ label="Adresse de la boutique" facultatif value={b.adresse ?? ''} onChange={e => maj(x => ({ ...x, adresse: vide(e.target.value) }))} />
            <Champ label="Horaires" facultatif value={b.horaires ?? ''} onChange={e => maj(x => ({ ...x, horaires: vide(e.target.value) }))} placeholder="Lun–sam, 10 h – 20 h" />
            <Champ label="Paiement" value={b.paiement} disabled aide="Paiement à la livraison uniquement (décision D3)." />
          </div>
        </CarteAdmin>

        <CarteAdmin titre="Réseaux sociaux">
          <div className="grid gap-5 md:grid-cols-2">
            <Champ label="Instagram : lien" type="url" value={b.instagram.url} erreur={erreurs.instagram} onChange={e => maj(x => ({ ...x, instagram: { ...x.instagram, url: e.target.value.trim() } }), 'instagram')} />
            <Champ label="Instagram : nom affiché" value={b.instagram.pseudo} onChange={e => maj(x => ({ ...x, instagram: { ...x.instagram, pseudo: e.target.value } }))} />
            <Champ label="Facebook : lien" type="url" value={b.facebook.url} erreur={erreurs.facebook} onChange={e => maj(x => ({ ...x, facebook: { ...x.facebook, url: e.target.value.trim() } }), 'facebook')} />
            <Champ label="Facebook : nom affiché" value={b.facebook.nom} onChange={e => maj(x => ({ ...x, facebook: { ...x.facebook, nom: e.target.value } }))} />
          </div>
        </CarteAdmin>

        <CarteAdmin titre="Livraison et retours" texte="Affichés sur la page « Livraison & retours », dans la FAQ et au moment de commander.">
          <div className="grid gap-5 md:grid-cols-2">
            <Champ label="Zones de livraison" facultatif value={b.livraison.zones ?? ''} onChange={e => maj(x => ({ ...x, livraison: { ...x.livraison, zones: vide(e.target.value) } }))} placeholder="Tout le Maroc" />
            <Champ label="Délai" facultatif value={b.livraison.delai ?? ''} onChange={e => maj(x => ({ ...x, livraison: { ...x.livraison, delai: vide(e.target.value) } }))} placeholder="24 à 72 h" />
            <Champ label="Frais de livraison (DH)" facultatif inputMode="numeric" value={b.livraison.fraisDH ?? ''} erreur={erreurs.fraisDH}
              aide="0 = livraison offerte. Vide = « À confirmer »."
              onChange={e => { const c = e.target.value.replace(/\D/g, ''); maj(x => ({ ...x, livraison: { ...x.livraison, fraisDH: c ? Number(c) : null } }), 'fraisDH') }} />
          </div>
          <div className="mt-5"><ZoneTexte label="Échanges et retours" facultatif rows={4} value={b.retours ?? ''} onChange={e => maj(x => ({ ...x, retours: vide(e.target.value) }))} /></div>
        </CarteAdmin>

        <div className="flex flex-wrap items-center gap-4">
          <Bouton type="submit" variante="accent" chargement={envoi} disabled={!modifie}>Enregistrer les réglages</Bouton>
          <Bouton variante="contour" disabled={!modifie || envoi} onClick={() => { setB(structuredClone(chargement.donnees!)); setErreurs({}) }}>Annuler</Bouton>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gris" aria-live="polite">{modifie ? 'Modifications non enregistrées' : 'À jour'}</p>
        </div>
      </form>
    </>
  )
}
