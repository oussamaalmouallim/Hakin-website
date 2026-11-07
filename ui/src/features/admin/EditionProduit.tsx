import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { Bouton, Champ, Selection, ZoneTexte, useNotifier } from '@/design-system'
import { CHAMPS_A_CONFIRMER, TAILLES_CHAUSSURES, TAILLES_VETEMENTS, nettoyerAConfirmer, produitVide, slugEnSaisie, slugifier, validerProduit, type ErreursProduit } from '@/lib/admin'
import { categories, collections, srcImage } from '@/lib/catalogue'
import { chargerDonnees } from '@/lib/donnees'
import type { ProduitAdmin } from '@/lib/produitsBase'
import type { ImageProduit } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Teinte proposée pour un nouveau coloris : l'encre de la charte (token `--encre`), sans couleur écrite dans le code. */
const teinteInitiale = () => getComputedStyle(document.documentElement).getPropertyValue('--encre').trim()
import { creerProduit, lireProduit, listerProduits, modifierProduit, supprimerPhoto, supprimerProduit, televerserPhoto } from './api'
import { controlerPhoto, preparerPhoto } from './photos'
import { CarteAdmin, Chargement, Confirmation, EnTeteAdmin, ErreurAdmin, Interrupteur, useAvertirSiModifie } from './commun'

const VUES: { cle: ImageProduit['vue']; libelle: string }[] = [
  { cle: 'face', libelle: 'Face' }, { cle: 'dos', libelle: 'Dos' }, { cle: 'detail', libelle: 'Détail' }, { cle: 'porte', libelle: 'Portée' },
]
/** Prix en dirhams entiers : on ne garde que les chiffres ; vide = pas de prix. */
const nombreOuNull = (v: string) => { const c = v.replace(/\D/g, ''); return c ? Number(c) : null }
const petitBouton = 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ligne-forte text-encre transition-colors hover:bg-encre hover:text-fond disabled:pointer-events-none disabled:opacity-30'

export function EditionProduit() {
  const { slug: slugUrl } = useParams()
  const creation = !slugUrl
  const naviguer = useNavigate()
  const notifier = useNotifier()
  const [initial, setInitial] = useState<ProduitAdmin | null>(null)
  const [p, setP] = useState<ProduitAdmin | null>(null)
  const [slugs, setSlugs] = useState<string[]>([])
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)
  const [erreurs, setErreurs] = useState<ErreursProduit>({})
  const [envoi, setEnvoi] = useState(false)
  const [photosEnCours, setPhotosEnCours] = useState(0)
  const [aRetirer, setARetirer] = useState<string[]>([])
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [nouvelleTaille, setNouvelleTaille] = useState('')
  const [slugManuel, setSlugManuel] = useState(false)
  const champFichier = useRef<HTMLInputElement>(null)

  // Jeton du dernier chargement : une réponse arrivée après un chargement plus récent (ou après la saisie) est ignorée,
  // sinon elle effacerait ce que l'utilisateur a déjà tapé.
  const jeton = useRef(0)
  const charger = async () => {
    const n = ++jeton.current
    setErreurChargement(null)
    try {
      const liste = await listerProduits()
      const depart = creation ? produitVide(categories.find(c => c.actif)?.slug ?? '') : await lireProduit(slugUrl!)
      if (n !== jeton.current) return
      setSlugs(liste.map(x => x.slug).filter(s => s !== slugUrl))
      if (!depart) { setErreurChargement('Cette pièce n\'existe pas, ou plus.'); return }
      setInitial(depart); setP(structuredClone(depart))
    } catch (e) { if (n === jeton.current) setErreurChargement((e as Error).message) }
  }
  useEffect(() => { void charger(); return () => { jeton.current++ } }, [slugUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const modifie = useMemo(() => !!p && !!initial && JSON.stringify(p) !== JSON.stringify(initial), [p, initial])
  useAvertirSiModifie(modifie)

  if (erreurChargement) return <><EnTeteAdmin surtitre="Catalogue" titre="Pièce" /><ErreurAdmin message={erreurChargement} onReessayer={charger} /></>
  if (!p) return <Chargement />

  const maj = <K extends keyof ProduitAdmin>(k: K, v: ProduitAdmin[K]) => { setP(x => (x ? { ...x, [k]: v } : x)); setErreurs(e => ({ ...e, [k]: undefined })) }

  const ajouterTailles = (liste: string[]) => {
    const deja = new Set(p.tailles.map(t => t.taille))
    maj('tailles', [...p.tailles, ...liste.filter(t => t.trim() && !deja.has(t.trim())).map(t => ({ taille: t.trim(), disponible: true }))])
  }
  const deplacerPhoto = (i: number, sens: -1 | 1) => {
    const images = [...p.images]
    const [x] = images.splice(i, 1)
    images.splice(i + sens, 0, x)
    maj('images', images)
  }
  const envoyerPhotos = async (fichiers: FileList | null) => {
    if (!fichiers?.length) return
    if (!p.slug) { setErreurs(e => ({ ...e, slug: 'Indiquez d\'abord le nom de la pièce : il sert à ranger les photos.' })); return }
    for (const f of Array.from(fichiers)) {
      const refus = controlerPhoto(f)
      if (refus) { notifier({ ton: 'erreur', message: refus }); continue }
      setPhotosEnCours(n => n + 1)
      try {
        const src = await televerserPhoto(p.slug, await preparerPhoto(f))
        setP(x => (x ? { ...x, images: [...x.images, { src, alt: `${x.nom || 'Pièce'} — vue ${x.images.length + 1}`, vue: x.images.length ? 'detail' : 'face' }] } : x))
      } catch (e) { notifier({ ton: 'erreur', message: `« ${f.name} » : ${(e as Error).message}` }) }
      finally { setPhotosEnCours(n => n - 1) }
    }
    if (champFichier.current) champFichier.current.value = ''
  }

  const enregistrer = async () => {
    const pret = { ...p, slug: creation ? slugifier(p.slug) : p.slug, nom: p.nom.trim(), marque: p.marque.trim(), aConfirmer: nettoyerAConfirmer(p) }
    const e = validerProduit(pret, slugs)
    setErreurs(e)
    if (Object.values(e).some(Boolean)) {
      notifier({ ton: 'erreur', message: 'Corrigez les champs signalés en rouge.' })
      document.querySelector<HTMLElement>('[aria-invalid="true"], [data-erreur="true"]')?.focus()
      return
    }
    setEnvoi(true)
    try {
      if (creation) await creerProduit(pret); else await modifierProduit(pret)
      await Promise.all(aRetirer.map(src => supprimerPhoto(src).catch(() => undefined)))
      setARetirer([])
      setInitial(pret); setP(pret)
      void chargerDonnees()
      notifier({ ton: 'succes', message: creation ? 'Pièce créée.' : 'Modifications enregistrées.' })
      if (creation) naviguer(`/admin/produits/${pret.slug}`, { replace: true })
    } catch (err) { notifier({ ton: 'erreur', message: (err as Error).message }) }
    finally { setEnvoi(false) }
  }

  const supprimer = async () => {
    try {
      await supprimerProduit(p.slug)
      await Promise.all([...p.images.map(i => i.src), ...aRetirer].map(src => supprimerPhoto(src).catch(() => undefined)))
      void chargerDonnees()
      notifier({ ton: 'succes', message: 'Pièce supprimée.' })
      naviguer('/admin/produits', { replace: true })
    } catch (e) { notifier({ ton: 'erreur', message: (e as Error).message }); setConfirmerSuppression(false) }
  }

  const solde = p.prixDH !== null && p.prixBarreDH !== null && p.prixBarreDH > p.prixDH

  return (
    <>
      <Link to="/admin/produits" className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gris hover:text-encre"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Tous les produits</Link>
      <EnTeteAdmin surtitre={creation ? 'Nouvelle pièce' : 'Modifier la pièce'} titre={p.nom || 'Sans nom'}
        actions={!creation && initial?.publie ? <a href={`/produit/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-encre underline underline-offset-4">Voir sur le site<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a> : undefined} />

      <form noValidate onSubmit={e => { e.preventDefault(); void enregistrer() }} aria-label="Fiche de la pièce" className="grid gap-6 pb-28 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <CarteAdmin titre="Identité">
            <div className="grid gap-5 md:grid-cols-2">
              <Champ label="Nom" value={p.nom} erreur={erreurs.nom} required
                onChange={e => { const nom = e.target.value; setP(x => (x ? { ...x, nom, ...(creation && !slugManuel ? { slug: slugifier(nom) } : {}) } : x)); setErreurs(er => ({ ...er, nom: undefined, slug: undefined })) }} />
              <Champ label="Adresse de la page" value={p.slug} erreur={erreurs.slug} disabled={!creation}
                aide={creation ? `/produit/${p.slug || '…'}` : 'Fixée après création : les liens partagés restent valides.'}
                onChange={e => { setSlugManuel(true); maj('slug', slugEnSaisie(e.target.value)) }} onBlur={() => maj('slug', slugifier(p.slug))} />
              <Champ label="Marque" value={p.marque} onChange={e => maj('marque', e.target.value)} />
              <Selection label="Type" value={p.categorie} erreur={erreurs.categorie} onChange={e => maj('categorie', e.target.value)}>
                <option value="">Choisir…</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.nom}{c.actif ? '' : ' (rayon masqué)'}</option>)}
              </Selection>
              <Selection label="Rayon" value={p.genre ?? ''} onChange={e => maj('genre', (e.target.value || undefined) as ProduitAdmin['genre'])}
                aide="« Mixte » apparaît dans Hommes et dans Femmes.">
                <option value="homme">Hommes</option><option value="femme">Femmes</option><option value="mixte">Mixte</option><option value="">Aucun</option>
              </Selection>
              <Selection label="Disponibilité" value={p.disponibilite} onChange={e => maj('disponibilite', e.target.value as ProduitAdmin['disponibilite'])}>
                <option value="disponible">Disponible</option><option value="epuise">Épuisé</option><option value="a_confirmer">À confirmer</option>
              </Selection>
            </div>
            {collections.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gris">Collections</legend>
                <div className="flex flex-wrap gap-2">
                  {collections.map(c => {
                    const actif = p.collections.includes(c.slug)
                    return (
                      <button key={c.slug} type="button" aria-pressed={actif} onClick={() => maj('collections', actif ? p.collections.filter(x => x !== c.slug) : [...p.collections, c.slug])}
                        className={cn('rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors', actif ? 'border-encre bg-encre text-fond' : 'border-ligne-forte text-gris hover:border-encre hover:text-encre')}>
                        {c.nom}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </CarteAdmin>

          <CarteAdmin titre="Prix" texte="En dirhams. Vide = « Prix sur demande » : la pièce se commande seulement sur WhatsApp.">
            <div className="grid gap-5 md:grid-cols-2">
              <Champ label="Prix de vente (DH)" inputMode="numeric" value={p.prixDH ?? ''} erreur={erreurs.prixDH} placeholder="Prix sur demande"
                onChange={e => maj('prixDH', nombreOuNull(e.target.value))} />
              <Champ label="Ancien prix (DH)" inputMode="numeric" value={p.prixBarreDH ?? ''} erreur={erreurs.prixBarreDH} facultatif
                aide={solde ? `En solde : -${Math.round((1 - p.prixDH! / p.prixBarreDH!) * 100)} %, visible dans « Soldes ».` : 'Rempli seulement pour une pièce en solde : il s\'affiche barré.'}
                onChange={e => maj('prixBarreDH', nombreOuNull(e.target.value))} />
            </div>
          </CarteAdmin>

          <CarteAdmin titre="Tailles" texte="Sans taille, la pièce ne peut pas aller au panier. Une taille indisponible reste affichée, grisée.">
            <div data-erreur={!!erreurs.tailles} tabIndex={erreurs.tailles ? -1 : undefined}>
              {p.tailles.length > 0 && (
                <ul className="mb-5 flex flex-wrap gap-2">
                  {p.tailles.map((t, i) => (
                    <li key={`${t.taille}-${i}`} className="flex items-center gap-3 rounded-full border border-ligne-forte bg-blanc py-1.5 pl-4 pr-1.5">
                      <span className="font-mono text-[12px] uppercase">{t.taille}</span>
                      <Interrupteur actif={t.disponible} libelle={`Taille ${t.taille} disponible`}
                        onChange={v => maj('tailles', p.tailles.map((x, j) => (j === i ? { ...x, disponible: v } : x)))} />
                      <button type="button" aria-label={`Retirer la taille ${t.taille}`} onClick={() => maj('tailles', p.tailles.filter((_, j) => j !== i))}
                        className="grid h-7 w-7 place-items-center rounded-full text-gris hover:bg-encre hover:text-fond"><X className="h-3.5 w-3.5" aria-hidden /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40"><Champ label="Ajouter une taille" value={nouvelleTaille} onChange={e => setNouvelleTaille(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouterTailles([nouvelleTaille]); setNouvelleTaille('') } }} /></div>
                <Bouton variante="contour" taille="sm" className="mb-1" disabled={!nouvelleTaille.trim()} onClick={() => { ajouterTailles([nouvelleTaille]); setNouvelleTaille('') }}>Ajouter la taille</Bouton>
                <Bouton variante="texte" className="mb-2" onClick={() => ajouterTailles(TAILLES_VETEMENTS)}>XS à XXL</Bouton>
                <Bouton variante="texte" className="mb-2" onClick={() => ajouterTailles(TAILLES_CHAUSSURES)}>39 à 45</Bouton>
              </div>
              {erreurs.tailles && <p role="alert" className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreurs.tailles}</p>}
            </div>
          </CarteAdmin>

          <CarteAdmin titre="Coloris" texte="Ceux qu'on voit sur les photos. Chaque coloris s'affiche en pastille sur le site."
            actions={<Bouton variante="contour" taille="sm" icone={<Plus className="h-3.5 w-3.5" aria-hidden />} onClick={() => maj('coloris', [...p.coloris, { nom: '', hex: teinteInitiale() }])}>Ajouter un coloris</Bouton>}>
            <div data-erreur={!!erreurs.coloris} tabIndex={erreurs.coloris ? -1 : undefined}>
              {p.coloris.length === 0 ? <p className="text-[14px] text-gris">Aucun coloris.</p> : (
                <ul className="flex flex-col gap-3">
                  {p.coloris.map((c, i) => (
                    <li key={i} className="flex items-end gap-3">
                      <label className="mb-1 shrink-0">
                        <span className="sr-only">Teinte du coloris {c.nom || i + 1}</span>
                        <input type="color" value={c.hex} onChange={e => maj('coloris', p.coloris.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                          className="h-11 w-11 cursor-pointer rounded-full border border-ligne-forte bg-blanc p-1" />
                      </label>
                      <div className="min-w-0 flex-1"><Champ label={`Coloris ${i + 1}`} value={c.nom} placeholder="noir, beige, bleu marine…"
                        onChange={e => maj('coloris', p.coloris.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} /></div>
                      <button type="button" aria-label={`Retirer le coloris ${c.nom || i + 1}`} className={cn(petitBouton, 'mb-1')}
                        onClick={() => maj('coloris', p.coloris.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </li>
                  ))}
                </ul>
              )}
              {erreurs.coloris && <p role="alert" className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreurs.coloris}</p>}
            </div>
          </CarteAdmin>

          <CarteAdmin titre="Photos" texte="JPEG, PNG ou WebP, 15 Mo au plus. Converties en WebP 480 et 960 px avant l'envoi. La première est la photo principale."
            actions={<>
              <input ref={champFichier} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="ajout-photos" aria-label="Choisir des photos à envoyer" tabIndex={-1} onChange={e => void envoyerPhotos(e.target.files)} />
              <Bouton variante="contour" taille="sm" chargement={photosEnCours > 0} icone={<ImagePlus className="h-4 w-4" aria-hidden />} onClick={() => champFichier.current?.click()}>
                {photosEnCours > 0 ? `Envoi (${photosEnCours})…` : 'Ajouter des photos'}
              </Bouton>
            </>}>
            <div data-erreur={!!erreurs.images} tabIndex={erreurs.images ? -1 : undefined}>
              {p.images.length === 0 ? <p className="text-[14px] text-gris">Aucune photo.</p> : (
                <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {p.images.map((img, i) => (
                    <li key={img.src} className="flex flex-col gap-3 rounded-[14px] bg-blanc p-3">
                      <div className="relative aspect-square overflow-hidden rounded-[10px] bg-fond-2">
                        <img src={srcImage(img.src, 480)} alt="" className="h-full w-full object-cover" />
                        {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-encre px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fond">Principale</span>}
                      </div>
                      <Champ label="Description de la photo" value={img.alt} onChange={e => maj('images', p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
                      <div className="flex items-end gap-2">
                        <div className="flex-1"><Selection label="Vue" value={img.vue} onChange={e => maj('images', p.images.map((x, j) => (j === i ? { ...x, vue: e.target.value as ImageProduit['vue'] } : x)))}>
                          {VUES.map(v => <option key={v.cle} value={v.cle}>{v.libelle}</option>)}
                        </Selection></div>
                        <button type="button" aria-label="Avancer la photo" disabled={i === 0} className={cn(petitBouton, 'mb-1')} onClick={() => deplacerPhoto(i, -1)}><ArrowLeft className="h-4 w-4" aria-hidden /></button>
                        <button type="button" aria-label="Reculer la photo" disabled={i === p.images.length - 1} className={cn(petitBouton, 'mb-1')} onClick={() => deplacerPhoto(i, 1)}><ArrowRight className="h-4 w-4" aria-hidden /></button>
                        <button type="button" aria-label="Retirer la photo" className={cn(petitBouton, 'mb-1')}
                          onClick={() => { setARetirer(a => [...a, img.src]); maj('images', p.images.filter((_, j) => j !== i)) }}><Trash2 className="h-4 w-4" aria-hidden /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {erreurs.images && <p role="alert" className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreurs.images}</p>}
            </div>
          </CarteAdmin>

          <CarteAdmin titre="Description">
            <div className="grid gap-5">
              <ZoneTexte label="Description" rows={4} value={p.description} onChange={e => maj('description', e.target.value)} aide="Décrire seulement ce qui se voit sur les photos." />
              <div className="grid gap-5 md:grid-cols-2">
                <Champ label="Matière" facultatif value={p.matiere ?? ''} onChange={e => maj('matiere', e.target.value.trim() ? e.target.value : null)} />
                <Champ label="Entretien" facultatif value={p.entretien ?? ''} onChange={e => maj('entretien', e.target.value.trim() ? e.target.value : null)} />
              </div>
            </div>
          </CarteAdmin>
        </div>

        <div className="flex flex-col gap-6 xl:sticky xl:top-8 xl:self-start">
          <CarteAdmin titre="Visibilité">
            <div className="flex flex-col gap-4">
              {([['publie', 'Visible sur le site'], ['nouveau', 'Badge « Nouveau »'], ['misEnAvant', 'À la une (accueil)']] as const).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-[14px]">{l}</span>
                  <Interrupteur actif={p[k]} libelle={l} onChange={v => maj(k, v)} />
                </div>
              ))}
            </div>
          </CarteAdmin>
          <CarteAdmin titre="À confirmer" texte="Ces informations s'affichent « À confirmer » sur la fiche. Un prix ou des tailles saisis retirent leur mention.">
            <div className="flex flex-col gap-3">
              {CHAMPS_A_CONFIRMER.map(c => (
                <label key={c} className="flex cursor-pointer items-center gap-3 text-[14px]">
                  <input type="checkbox" checked={p.aConfirmer.includes(c)} className="h-4 w-4 accent-[var(--encre)]"
                    onChange={e => maj('aConfirmer', e.target.checked ? [...p.aConfirmer, c] : p.aConfirmer.filter(x => x !== c))} />
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </label>
              ))}
            </div>
          </CarteAdmin>
          {!creation && (
            <CarteAdmin titre="Supprimer" texte="La pièce et ses photos envoyées ici disparaissent. Les commandes passées gardent leur nom et leur prix.">
              <Bouton variante="contour" className="border-danger text-danger hover:bg-danger hover:text-fond" icone={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => setConfirmerSuppression(true)}>Supprimer la pièce</Bouton>
            </CarteAdmin>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ligne bg-[var(--voile-entete)] px-5 py-4 backdrop-blur-[18px] lg:left-[260px] md:px-10 lg:px-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gris" aria-live="polite">{modifie ? 'Modifications non enregistrées' : creation ? 'Nouvelle pièce' : 'À jour'}</p>
            <div className="flex gap-3">
              <Bouton variante="contour" disabled={!modifie || envoi} onClick={() => { setP(structuredClone(initial!)); setErreurs({}); setARetirer([]) }}>Annuler</Bouton>
              <Bouton type="submit" variante="accent" chargement={envoi} disabled={photosEnCours > 0 || (!modifie && !creation)}>{creation ? 'Créer la pièce' : 'Enregistrer'}</Bouton>
            </div>
          </div>
        </div>
      </form>

      <Confirmation ouvert={confirmerSuppression} titre="Supprimer cette pièce ?" libelle="Supprimer définitivement" onFermer={() => setConfirmerSuppression(false)} onConfirmer={supprimer}
        texte={<p>« {p.nom} » sera retirée du site et de la base. Cette action ne peut pas être annulée.</p>} />
    </>
  )
}
