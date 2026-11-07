import { useEffect, useMemo, useState } from 'react'
import { Bouton, ZoneTexte, useNotifier } from '@/design-system'
import { chargerDonnees } from '@/lib/donnees'
import { SECTIONS_TEXTES, fusionnerTextes, type Textes as TextesPages } from '@/lib/produitsBase'
import { enregistrerReglage, lireReglages } from './api'
import { CarteAdmin, Chargement, EnTeteAdmin, ErreurAdmin, useAvertirSiModifie, useChargement } from './commun'

const PAGES = [
  { cle: 'mentions-legales', titre: 'Mentions légales', lien: '/mentions-legales' },
  { cle: 'cgv', titre: 'Conditions générales de vente', lien: '/cgv' },
] as const

/** Textes juridiques et d'aide : à fournir ou valider par la boutique. Vide = « À confirmer » sur le site. */
export function Textes() {
  const notifier = useNotifier()
  const chargement = useChargement(async () => fusionnerTextes((await lireReglages()).textes))
  const [t, setT] = useState<TextesPages | null>(null)
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { if (chargement.donnees) setT(structuredClone(chargement.donnees)) }, [chargement.donnees])
  const modifie = useMemo(() => !!t && JSON.stringify(t) !== JSON.stringify(chargement.donnees), [t, chargement.donnees])
  useAvertirSiModifie(modifie)

  if (chargement.erreur) return <><EnTeteAdmin surtitre="Site" titre="Textes" /><ErreurAdmin message={chargement.erreur} onReessayer={chargement.recharger} /></>
  if (!t) return <Chargement />

  const enregistrer = async () => {
    setEnvoi(true)
    try {
      const propre: TextesPages = {
        'mentions-legales': Object.fromEntries(Object.entries(t['mentions-legales']).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)),
        cgv: Object.fromEntries(Object.entries(t.cgv).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)),
        confidentialiteResponsable: t.confidentialiteResponsable.trim(), guideDesTailles: t.guideDesTailles.trim(),
      }
      await enregistrerReglage('textes', propre)
      chargement.remplacer(propre); setT(structuredClone(propre))
      void chargerDonnees()
      notifier({ ton: 'succes', message: 'Textes enregistrés : les pages du site sont à jour.' })
    } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }) }
    finally { setEnvoi(false) }
  }

  return (
    <>
      <EnTeteAdmin surtitre="Site" titre="Textes"
        texte="Pages juridiques et d'aide. Ces textes doivent être fournis ou validés par la boutique ; une section vide s'affiche « À confirmer »." />
      <form noValidate aria-label="Textes des pages" onSubmit={e => { e.preventDefault(); void enregistrer() }} className="flex flex-col gap-6 pb-10">
        {PAGES.map(page => (
          <CarteAdmin key={page.cle} titre={page.titre} actions={<a href={page.lien} target="_blank" rel="noopener noreferrer" className="label text-encre underline underline-offset-4">Voir la page</a>}>
            <div className="grid gap-5">
              {SECTIONS_TEXTES[page.cle].map(section => (
                <ZoneTexte key={section} label={section} rows={3} facultatif value={t[page.cle][section] ?? ''}
                  onChange={e => setT(x => (x ? { ...x, [page.cle]: { ...x[page.cle], [section]: e.target.value } } : x))} />
              ))}
            </div>
          </CarteAdmin>
        ))}
        <CarteAdmin titre="Confidentialité" actions={<a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="label text-encre underline underline-offset-4">Voir la page</a>}>
          <ZoneTexte label="Responsable du traitement et contact" rows={3} facultatif value={t.confidentialiteResponsable}
            onChange={e => setT(x => (x ? { ...x, confidentialiteResponsable: e.target.value } : x))} />
        </CarteAdmin>
        <CarteAdmin titre="Guide des tailles" actions={<a href="/guide-des-tailles" target="_blank" rel="noopener noreferrer" className="label text-encre underline underline-offset-4">Voir la page</a>}>
          <ZoneTexte label="Conseils et correspondances de tailles" rows={5} facultatif value={t.guideDesTailles}
            aide="Vide : la page invite à demander conseil sur WhatsApp." onChange={e => setT(x => (x ? { ...x, guideDesTailles: e.target.value } : x))} />
        </CarteAdmin>
        <div className="flex flex-wrap items-center gap-4">
          <Bouton type="submit" variante="accent" chargement={envoi} disabled={!modifie}>Enregistrer les textes</Bouton>
          <Bouton variante="contour" disabled={!modifie || envoi} onClick={() => setT(structuredClone(chargement.donnees!))}>Annuler</Bouton>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gris" aria-live="polite">{modifie ? 'Modifications non enregistrées' : 'À jour'}</p>
        </div>
      </form>
    </>
  )
}
