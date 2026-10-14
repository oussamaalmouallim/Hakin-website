import { useState, type FormEvent } from 'react'
import { MapPin } from 'lucide-react'
import { AConfirmer, Bouton, BoutonExterne, Champ, IconeWhatsApp, Revelation, Selection, ZoneTexte } from '@/design-system'
import { EnTetePage } from '@/components/EnTetePage'
import { LiensReseaux } from '@/components/Reseaux'
import { boutique, categories } from '@/lib/catalogue'
import { telephoneMarocValide } from '@/lib/format'
import { lienWhatsApp, messageContact } from '@/lib/whatsapp'

/** Formulaire de contact → WhatsApp pré-rempli (fonctionnalité de l'ancien site, conservée). */
export function PageContact() {
  const [f, setF] = useState({ nom: '', telephone: '', sujet: '', message: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [lien, setLien] = useState<string | null>(null)
  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.nom.trim().length < 2) er.nom = 'Indiquez votre nom.'
    if (!telephoneMarocValide(f.telephone)) er.telephone = 'Numéro marocain attendu.'
    if (f.message.trim().length < 5) er.message = 'Écrivez votre message.'
    setErreurs(er)
    if (Object.keys(er).length) return
    const l = lienWhatsApp(messageContact(f))
    window.open(l, '_blank', 'noopener,noreferrer')
    setLien(l)
  }
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setErreurs({ ...erreurs, [k]: '' }) }
  return (
    <>
      <EnTetePage surtitre="Contact" titre="Parlons de votre style" texte="Une pièce précise, une taille, une disponibilité ? Nous répondons personnellement."
        ariane={[{ libelle: 'Accueil', vers: '/' }, { libelle: 'Contact' }]} />
      <div className="conteneur grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <Revelation className="flex flex-col gap-10">
          <BoutonExterne href={lienWhatsApp()} variante="whatsapp" taille="lg" className="self-start" icone={<IconeWhatsApp className="h-5 w-5 text-whatsapp" />}>{boutique.whatsappAffiche}</BoutonExterne>
          <LiensReseaux avecTexte />
          <div className="flex gap-4">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-bronze" strokeWidth={1.25} />
            <div>
              <p className="label mb-2">Adresse</p>
              <p>{boutique.ville}</p>
              <p className="text-gris">{boutique.adresse ?? <AConfirmer>Adresse complète à venir</AConfirmer>}</p>
              <p className="mt-3 label mb-1">Horaires</p>
              <p className="text-gris">{boutique.horaires ?? <AConfirmer />}</p>
            </div>
          </div>
        </Revelation>
        <Revelation delai={0.1}>
          {lien ? (
            <div className="flex flex-col items-start gap-5 bg-sable-50 p-10">
              <p className="filet-etoile" aria-hidden>✦</p>
              <h2 className="titre-2">Votre message est prêt</h2>
              <p className="text-gris">WhatsApp s'est ouvert avec votre message. Appuyez sur « Envoyer » : nous vous répondons rapidement.</p>
              <BoutonExterne href={lien} icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Rouvrir WhatsApp</BoutonExterne>
              <Bouton variante="texte" onClick={() => { setLien(null); setF({ nom: '', telephone: '', sujet: '', message: '' }) }}>Écrire un autre message</Bouton>
            </div>
          ) : (
            <form noValidate onSubmit={envoyer} className="grid gap-7 sm:grid-cols-2" aria-label="Formulaire de contact">
              <Champ label="Votre nom" autoComplete="name" value={f.nom} onChange={maj('nom')} erreur={erreurs.nom} />
              <Champ label="Téléphone / WhatsApp" type="tel" autoComplete="tel" value={f.telephone} onChange={maj('telephone')} erreur={erreurs.telephone} placeholder="06 12 34 56 78" />
              <div className="sm:col-span-2">
                <Selection label="Ce que vous cherchez" facultatif value={f.sujet} onChange={maj('sujet')}>
                  <option value="">Sélectionner…</option>
                  {categories.map(c => <option key={c.slug}>{c.nom}</option>)}
                  <option>Autre</option>
                </Selection>
              </div>
              <div className="sm:col-span-2"><ZoneTexte label="Message" value={f.message} onChange={maj('message')} erreur={erreurs.message} placeholder="Je cherche le t-shirt Casa Way en taille L, disponible ?" /></div>
              <div className="sm:col-span-2"><Bouton type="submit" taille="lg" icone={<IconeWhatsApp className="h-4 w-4 text-whatsapp" />}>Envoyer sur WhatsApp</Bouton></div>
            </form>
          )}
        </Revelation>
      </div>
    </>
  )
}
