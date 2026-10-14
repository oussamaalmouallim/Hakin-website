import { useState, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  Accordeon, AConfirmer, Badge, Bouton, CaseACocher, Champ, EtatErreur, EtatVide, FilAriane, IconeWhatsApp, Logotype, Modale,
  Monogramme, PastillesColoris, Prix, Quantite, SelecteurColoris, SelecteurTaille, Selection, Signature, SqueletteCarte, Tiroir,
  ZoneTexte, useNotifier,
} from '@/design-system'
import { CarteProduit } from '@/components/CarteProduit'
import { BandeauDefilant } from '@/components/Ambiance'
import { produits } from '@/lib/catalogue'

/** Référence interne du design system (non liée dans le menu) : tokens + composants dans leurs états. */
const COULEURS: [string, string, string][] = [
  ['nacre', '#FBF9F5', 'Fond principal'], ['neige', '#FFFFFF', 'Cartes, modales'], ['sable-50', '#F4EDE3', 'Sections alternées'],
  ['sable-200', '#E4D0B7', 'Ambiance (maquette)'], ['sable-400', '#CAB59B', 'Séparateurs marqués'], ['bronze', '#836240', 'Monogramme, accents'],
  ['bronze-fonce', '#5F4831', 'Survol accents'], ['or', '#C8A96E', 'Filets, étoile ✦'], ['encre', '#0E0E0D', 'Texte, boutons'],
  ['gris', '#6F6C66', 'Texte secondaire (AA)'], ['ligne', '#E8E2D8', 'Bordures fines'], ['succes', '#5B6B3A', 'Succès'],
  ['erreur', '#9A3B2E', 'Erreur'], ['alerte', '#A9742A', 'Alerte'],
]

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return <section className="border-t border-ligne py-14"><h2 className="label-large mb-10 text-bronze">{titre}</h2>{children}</section>
}

export function PageDesignSystem() {
  const notifier = useNotifier()
  const [modale, setModale] = useState(false)
  const [tiroir, setTiroir] = useState(false)
  const [taille, setTaille] = useState<string | null>('M')
  const [coloris, setColoris] = useState<string | null>('noir')
  const [qte, setQte] = useState(1)
  const p = produits[7]
  return (
    <div className="conteneur pt-32">
      <p className="label text-bronze">Interne</p>
      <h1 className="titre-1 mt-3">Design system H MODE</h1>
      <p className="mt-4 max-w-xl text-gris">Référence de validation des tokens et composants. Source : <code>tailwind.config.js</code>, <code>src/styles/index.css</code>, <code>src/design-system/</code>.</p>

      <Bloc titre="Marque">
        <div className="flex flex-wrap items-end gap-12"><Monogramme className="h-24" /><Logotype /><div className="bg-encre p-6"><Logotype clair /></div><Signature /></div>
        <p className="mt-6 text-[13px] text-gris">Monogramme redessiné d'après Template/hero.png — provisoire jusqu'à réception du fichier source.</p>
      </Bloc>

      <Bloc titre="Couleurs">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {COULEURS.map(([n, hex, usage]) => (
            <div key={n}><div className="aspect-square border border-ligne" style={{ background: hex }} /><p className="label mt-3">{n}</p><p className="text-[12px] text-gris">{hex} · {usage}</p></div>
          ))}
        </div>
      </Bloc>

      <Bloc titre="Typographie">
        <div className="flex flex-col gap-6">
          <p className="titre-display">Display</p><p className="titre-1">Titre 1 — Cormorant Garamond</p><p className="titre-2">Titre 2 <em>italique</em></p>
          <p className="titre-3">Titre 3</p><p className="max-w-xl text-[17px]">Corps — Jost Light 16–17 px, lisible sur mobile et dans les formulaires.</p>
          <p className="label">Label — capitales espacées 0,22 em</p><p className="label-large">Label large — 0,32 em</p>
          <a className="lien-souligne self-start" href="#dummy" onClick={e => e.preventDefault()}>Lien souligné animé <ArrowRight className="h-3.5 w-3.5" /></a>
        </div>
      </Bloc>

      <Bloc titre="Boutons">
        <div className="flex flex-wrap items-center gap-4">
          <Bouton>Plein</Bouton><Bouton variante="contour">Contour</Bouton><Bouton variante="texte">Texte</Bouton>
          <Bouton variante="whatsapp" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>WhatsApp</Bouton>
          <Bouton chargement>Chargement</Bouton><Bouton disabled>Désactivé</Bouton><Bouton taille="sm">Petit</Bouton><Bouton taille="lg">Grand</Bouton>
          <div className="bg-encre p-4"><Bouton variante="clair">Clair</Bouton> <Bouton variante="contour-clair">Contour clair</Bouton></div>
        </div>
      </Bloc>

      <Bloc titre="Formulaires">
        <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
          <Champ label="Champ" placeholder="Saisie" /><Champ label="Champ en erreur" defaultValue="06 00" erreur="Numéro marocain attendu." />
          <Champ label="Avec aide" aide="Texte d'aide." facultatif /><Selection label="Sélection"><option>Casablanca</option><option>Rabat</option></Selection>
          <div className="sm:col-span-2"><ZoneTexte label="Zone de texte" /></div>
          <CaseACocher label="Case à cocher" defaultChecked /><CaseACocher label="Case en erreur" erreur="Obligatoire." />
        </div>
      </Bloc>

      <Bloc titre="Sélecteurs produit">
        <div className="flex flex-col gap-8">
          <SelecteurTaille tailles={[{ taille: 'S', disponible: true }, { taille: 'M', disponible: true }, { taille: 'L', disponible: true }, { taille: 'XXL', disponible: false }]} valeur={taille} onChange={setTaille} />
          <SelecteurColoris coloris={p.coloris} valeur={coloris} onChange={setColoris} />
          <div className="flex items-center gap-8"><Quantite valeur={qte} onChange={setQte} /><Quantite petit valeur={qte} onChange={setQte} /><PastillesColoris coloris={p.coloris} /></div>
          <div className="flex items-center gap-8"><Prix prixDH={590} prixBarreDH={690} grand /><Prix prixDH={null} /><AConfirmer /><Badge>Nouveau</Badge><Badge ton="sombre">Épuisé</Badge><Badge ton="or">Édition</Badge></div>
        </div>
      </Bloc>

      <Bloc titre="Carte produit (cadre passe-partout, packshot) & états">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4"><CarteProduit produit={p} /><CarteProduit produit={produits.find(x => x.categorie === 'sneakers') ?? produits[0]} /><SqueletteCarte /><SqueletteCarte /></div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2"><EtatVide titre="État vide" texte="Message utile et action." action={<Bouton variante="contour">Action</Bouton>} /><EtatErreur texte="Explication et solution." action={<Bouton variante="contour">Réessayer</Bouton>} /></div>
      </Bloc>

      <Bloc titre="Navigation & retours">
        <div className="flex flex-col gap-8">
          <FilAriane elements={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Boutique', vers: '/boutique' }, { libelle: 'Produit' }]} />
          <div className="max-w-xl"><Accordeon titre="Accordéon" ouvertParDefaut>Contenu replié avec animation de hauteur.</Accordeon><Accordeon titre="Second panneau">…</Accordeon></div>
          <div className="flex flex-wrap gap-3">
            <Bouton variante="contour" onClick={() => setModale(true)}>Ouvrir une modale</Bouton>
            <Bouton variante="contour" onClick={() => setTiroir(true)}>Ouvrir un tiroir</Bouton>
            <Bouton variante="contour" onClick={() => notifier({ ton: 'succes', message: 'Notification de succès.' })}>Succès</Bouton>
            <Bouton variante="contour" onClick={() => notifier({ ton: 'erreur', message: 'Notification d\'erreur.' })}>Erreur</Bouton>
            <Bouton variante="contour" onClick={() => notifier({ ton: 'info', message: 'Article retiré.', action: { libelle: 'Annuler', onClick: () => undefined } })}>Avec action</Bouton>
          </div>
        </div>
      </Bloc>

      <Bloc titre="Bandeau défilant"><div className="-mx-4 sm:-mx-6 lg:-mx-10"><BandeauDefilant elements={['Maisons iconiques', 'Riviera Casablanca', 'Paiement à la livraison']} /></div></Bloc>

      <Modale ouvert={modale} onFermer={() => setModale(false)} titre="Modale"><p className="text-gris">Focus piégé, Échap pour fermer, défilement de page bloqué.</p></Modale>
      <Tiroir ouvert={tiroir} onFermer={() => setTiroir(false)} titre="Tiroir" label="Tiroir de démonstration"><p className="text-gris">Panneau latéral (mini-panier, filtres, menu).</p></Tiroir>
    </div>
  )
}
