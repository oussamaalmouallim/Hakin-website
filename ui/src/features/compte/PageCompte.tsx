import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Package, Trash2, User } from 'lucide-react'
import { Bouton, BoutonLien, CaseACocher, Champ, EtatVide, Modale, PastilleCouleur, Prix, Selection, ZoneTexte, useNotifier } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { CarteProduit } from '@/components/CarteProduit'
import { useCompte, type Adresse } from '@/state/compte'
import { useFavoris } from '@/state/favoris'
import { usePanier } from '@/state/panier'
import { trouverProduit } from '@/lib/catalogue'
import { formatDH, telephoneMarocValide } from '@/lib/format'
import { VILLES } from '@/features/commande/PageCommande'
import { cn } from '@/lib/utils'
import { obtenirSupabase, supabaseActif } from '@/lib/supabase'
import { useSession } from '@/state/session'
import { rafraichirCommandes, viderFileSynchro } from '@/state/synchroCompte'

/** Connecté à un compte Supabase : les données vivent dans le compte, pas seulement sur cet appareil. */
const useConnecte = () => useSession(s => Boolean(s.utilisateur))

const ONGLETS = [
  { vers: '/compte', l: 'Profil', Icone: User, fin: true },
  { vers: '/compte/commandes', l: 'Commandes', Icone: Package },
  { vers: '/compte/adresses', l: 'Adresses', Icone: MapPin },
  { vers: '/compte/favoris', l: 'Favoris', Icone: Heart },
]

function Profil() {
  const { profil, majProfil, toutEffacer } = useCompte()
  const viderFavoris = useFavoris.setState
  const notifier = useNotifier()
  const [p, setP] = useState(profil)
  const [erreur, setErreur] = useState<string>()
  const [confirmer, setConfirmer] = useState(false)
  const connecte = useConnecte()
  useEffect(() => setP(profil), [profil])
  const enregistrer = (e: FormEvent) => {
    e.preventDefault()
    if (p.telephone && !telephoneMarocValide(p.telephone)) { setErreur('Numéro marocain attendu.'); return }
    majProfil(p); notifier({ ton: 'succes', message: connecte ? 'Profil enregistré dans votre compte.' : 'Profil enregistré sur cet appareil.' })
  }
  return (
    <div className="max-w-xl">
      <form onSubmit={enregistrer} className="grid gap-7">
        <Champ label="Nom complet" autoComplete="name" value={p.nom} onChange={e => setP({ ...p, nom: e.target.value })} />
        <Champ label="Téléphone (WhatsApp)" type="tel" autoComplete="tel" value={p.telephone} erreur={erreur} onChange={e => { setP({ ...p, telephone: e.target.value }); setErreur(undefined) }} />
        <Champ label="E-mail" type="email" facultatif autoComplete="email" value={p.email} onChange={e => setP({ ...p, email: e.target.value })} />
        <div><Bouton type="submit">Enregistrer</Bouton></div>
      </form>
      {!connecte && <div className="mt-16 border-t border-ligne pt-8">
        <p className="label mb-2">Vos données</p>
        <p className="text-[14px] text-gris">Votre compte est enregistré uniquement dans ce navigateur, sur cet appareil. Rien n'est envoyé à un serveur.</p>
        <Bouton variante="texte" className="mt-4 text-erreur" onClick={() => setConfirmer(true)}>Effacer mes données</Bouton>
      </div>}
      <Modale ouvert={confirmer} onFermer={() => setConfirmer(false)} titre="Effacer vos données ?">
        <p className="text-gris">Profil, adresses, historique des commandes et favoris seront supprimés de cet appareil. Votre panier est conservé.</p>
        <div className="mt-8 flex gap-3">
          <Bouton onClick={() => { toutEffacer(); viderFavoris({ slugs: [] }); setP({ nom: '', telephone: '', email: '' }); setConfirmer(false); notifier({ ton: 'info', message: 'Données effacées.' }) }}>Effacer</Bouton>
          <Bouton variante="contour" onClick={() => setConfirmer(false)}>Annuler</Bouton>
        </div>
      </Modale>
    </div>
  )
}

function Commandes() {
  const commandes = useCompte(s => s.commandes)
  const ajouter = usePanier(s => s.ajouter)
  const notifier = useNotifier()
  const connecte = useConnecte()
  useEffect(() => { if (connecte) void rafraichirCommandes() }, [connecte])
  if (!commandes.length) return <EtatVide titre="Aucune commande" texte={connecte ? 'Les commandes passées avec votre compte apparaîtront ici.' : 'Les commandes envoyées depuis cet appareil apparaîtront ici.'} action={<BoutonLien to="/boutique" variante="contour">Découvrir la boutique</BoutonLien>} />
  return (
    <ul className="flex flex-col gap-6">
      {commandes.map(c => (
        <li key={c.reference} className="border border-ligne bg-neige p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="label">Réf. {c.reference}</p>
            <p className="text-[14px] text-gris">{new Date(c.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <ul className="mt-4 flex flex-col gap-1 text-[15px]">
            {c.lignes.map(l => <li key={l.cle} className="flex justify-between gap-4"><span>{l.nom} <span className="inline-flex items-center gap-1.5 text-gris">— <PastilleCouleur nom={l.coloris} /> {l.taille} × {l.quantite}</span></span><span className="tabular-nums">{formatDH(l.prixDH * l.quantite)}</span></li>)}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-ligne pt-4">
            <p>Sous-total <Prix prixDH={c.sousTotalDH} className="ml-2" /></p>
            <Bouton variante="contour" taille="sm" onClick={() => {
              const dispo = c.lignes.filter(l => trouverProduit(l.slug)?.prixDH != null)
              dispo.forEach(l => ajouter(l.slug, l.coloris, l.taille, l.quantite))
              notifier({ ton: dispo.length ? 'succes' : 'erreur', message: dispo.length ? 'Articles remis dans le panier.' : 'Ces articles ne sont plus disponibles.' })
            }}>Recommander</Bouton>
          </div>
          <p className="mt-3 text-[13px] text-gris">Statut : confirmée avec vous sur WhatsApp.</p>
        </li>
      ))}
    </ul>
  )
}

function Adresses() {
  const { adresses, enregistrerAdresse, supprimerAdresse } = useCompte()
  const vide = { libelle: '', ville: '', adresse: '', instructions: '', parDefaut: false }
  const [edition, setEdition] = useState<(Omit<Adresse, 'id'> & { id?: string }) | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const valider = (e: FormEvent) => {
    e.preventDefault(); if (!edition) return
    const er: Record<string, string> = {}
    if (!edition.ville) er.ville = 'Choisissez une ville.'
    if (edition.adresse.trim().length < 6) er.adresse = 'Adresse trop courte.'
    setErreurs(er); if (Object.keys(er).length) return
    enregistrerAdresse({ ...edition, libelle: edition.libelle || 'Adresse' }); setEdition(null)
  }
  return (
    <div>
      {adresses.length === 0 ? <EtatVide titre="Aucune adresse" texte="Enregistrez une adresse pour accélérer vos commandes." />
        : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {adresses.map(a => (
              <li key={a.id} className={cn('flex flex-col gap-2 border bg-neige p-6', a.parDefaut ? 'border-encre' : 'border-ligne')}>
                <p className="label">{a.libelle}{a.parDefaut && <span className="ml-3 rounded-full bg-accent px-2 py-0.5 text-[10px] text-encre">Par défaut</span>}</p>
                <p>{a.adresse}</p><p className="text-gris">{a.ville}</p>
                <div className="mt-3 flex gap-5">
                  <button type="button" className="label underline underline-offset-4" onClick={() => setEdition(a)}>Modifier</button>
                  <button type="button" className="label inline-flex items-center gap-1 text-gris hover:text-erreur" onClick={() => supprimerAdresse(a.id)}><Trash2 className="h-3.5 w-3.5" />Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      <Bouton variante="contour" className="mt-8" onClick={() => { setErreurs({}); setEdition(vide) }}>Ajouter une adresse</Bouton>
      <Modale ouvert={!!edition} onFermer={() => setEdition(null)} titre={edition?.id ? 'Modifier l\'adresse' : 'Nouvelle adresse'}>
        {edition && (
          <form onSubmit={valider} noValidate className="grid gap-6">
            <Champ label="Libellé" placeholder="Maison, bureau…" value={edition.libelle} onChange={e => setEdition({ ...edition, libelle: e.target.value })} />
            <Selection label="Ville" value={edition.ville} erreur={erreurs.ville} onChange={e => setEdition({ ...edition, ville: e.target.value })}>
              <option value="">Choisir…</option>{VILLES.map(v => <option key={v}>{v}</option>)}
            </Selection>
            <Champ label="Adresse" value={edition.adresse} erreur={erreurs.adresse} onChange={e => setEdition({ ...edition, adresse: e.target.value })} />
            <ZoneTexte label="Instructions" facultatif rows={2} value={edition.instructions} onChange={e => setEdition({ ...edition, instructions: e.target.value })} />
            <CaseACocher label="Adresse par défaut" checked={edition.parDefaut} onChange={() => setEdition({ ...edition, parDefaut: !edition.parDefaut })} />
            <Bouton type="submit">Enregistrer</Bouton>
          </form>
        )}
      </Modale>
    </div>
  )
}

function Favoris() {
  const slugs = useFavoris(s => s.slugs)
  const liste = slugs.map(trouverProduit).filter((p): p is NonNullable<typeof p> => !!p)
  if (!liste.length) return <EtatVide titre="Aucun favori" texte="Touchez le cœur d'une pièce pour la retrouver ici." action={<BoutonLien to="/boutique" variante="contour">Découvrir la boutique</BoutonLien>} />
  return <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3">{liste.map(p => <li key={p.slug}><CarteProduit produit={p} /></li>)}</ul>
}

/** Bandeau de session : connecté (e-mail + déconnexion) ou invitation à se connecter. Les données du compte passent en base au lot 6. */
/** Vrai si le compte connecté est administrateur (vérifié par la base, `est_admin()`). */
function useEstAdmin(id: string | undefined) {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    setAdmin(false)
    if (!id) return
    let actif = true
    obtenirSupabase().then(sb => sb?.rpc('est_admin')).then(r => { if (actif && r && !r.error) setAdmin(Boolean(r.data)) }).catch(() => undefined)
    return () => { actif = false }
  }, [id])
  return admin
}

function BandeauSession() {
  const { utilisateur, pret, deconnexion, erreurSynchro } = useSession()
  const admin = useEstAdmin(utilisateur?.id)
  const naviguer = useNavigate()
  const notifier = useNotifier()
  if (!supabaseActif || !pret) return null
  return utilisateur ? (<>
    {erreurSynchro && <p role="alert" className="mb-4 rounded-bloc border border-danger/40 bg-danger/[0.06] px-5 py-3 text-[14px] text-danger">{erreurSynchro}</p>}
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-bloc border border-ligne bg-fond-2 px-5 py-4">
      <p className="text-[14px]"><span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gris">Connecté · </span>{utilisateur.email}</p>
      <div className="flex flex-wrap gap-2">
        {admin && <Link to="/admin" className="rounded-full bg-accent px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-accent-doux">Administration</Link>}
        <button type="button" onClick={async () => { await viderFileSynchro(); await deconnexion(); notifier({ ton: 'info', message: 'Vous êtes déconnecté.' }); naviguer('/connexion', { replace: true }) }}
          className="rounded-full border border-encre px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-encre hover:text-fond">Se déconnecter</button>
      </div>
    </div>
  </>) : (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-bloc border border-ligne bg-fond-2 px-5 py-4">
      <p className="text-[14px] text-gris">Connectez-vous pour retrouver vos commandes et votre panier sur tous vos appareils.</p>
      <div className="flex gap-2">
        <Link to="/connexion?retour=/compte" className="rounded-full bg-encre px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fond">Connexion</Link>
        <Link to="/connexion?mode=inscription&retour=/compte" className="rounded-full border border-encre px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-encre hover:text-fond">Créer un compte</Link>
      </div>
    </div>
  )
}

export function PageCompte() {
  const nom = useCompte(s => s.profil.nom)
  const connecte = useConnecte()
  return (
    <>
      <EnTetePage surtitre="Mon compte" titre={nom ? `Bonjour, ${nom.split(' ')[0]}` : 'Mon compte'} texte={connecte ? 'Votre profil, vos adresses, votre panier, vos favoris et vos commandes sont enregistrés dans votre compte.' : 'Vos informations restent sur cet appareil et pré-remplissent vos commandes.'}
        ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Mon compte' }]} />
      <div className="conteneur grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-20">
        <nav aria-label="Sections du compte" className="defilement-masque -mx-4 flex gap-6 overflow-x-auto overscroll-x-contain border-b border-ligne px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:border-0 lg:px-0">
          {ONGLETS.map(({ vers, l, Icone, fin }) => (
            <NavLink key={vers} to={vers} end={fin} className={({ isActive }) => cn('label flex shrink-0 items-center gap-3 border-b-2 py-3 transition-colors lg:border-b-0 lg:border-l-2 lg:pl-4',
              isActive ? 'border-encre text-encre' : 'border-transparent text-gris hover:text-encre')}>
              <Icone className="h-4 w-4" strokeWidth={1.25} />{l}
            </NavLink>
          ))}
        </nav>
        <div>
          <BandeauSession />
          <Routes>
            <Route index element={<Profil />} />
            <Route path="commandes" element={<Commandes />} />
            <Route path="adresses" element={<Adresses />} />
            <Route path="favoris" element={<Favoris />} />
          </Routes>
        </div>
      </div>
    </>
  )
}
