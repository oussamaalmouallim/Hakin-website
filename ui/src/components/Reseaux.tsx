import { IconeFacebook, IconeInstagram, IconeWhatsApp } from '@/design-system'
import { boutique } from '@/lib/catalogue'
import { lienWhatsApp } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

export const RESEAUX = [
  { nom: 'Instagram', url: boutique.instagram.url, Icone: IconeInstagram, detail: boutique.instagram.pseudo },
  { nom: 'Facebook', url: boutique.facebook.url, Icone: IconeFacebook, detail: boutique.facebook.nom },
  { nom: 'WhatsApp', url: lienWhatsApp(), Icone: IconeWhatsApp, detail: boutique.whatsappAffiche },
]

export function LiensReseaux({ className, clair, avecTexte }: { className?: string; clair?: boolean; avecTexte?: boolean }) {
  return (
    <ul className={cn('flex items-center gap-2', avecTexte && 'flex-col items-start gap-4', className)}>
      {RESEAUX.map(({ nom, url, Icone, detail }) => (
        <li key={nom}>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={avecTexte ? undefined : `${nom} H MODE`}
            className={cn('group inline-flex items-center gap-3 transition-colors duration-300', clair ? 'text-nacre/80 hover:text-nacre' : 'text-encre/70 hover:text-encre')}>
            <span className={cn('grid h-10 w-10 place-items-center rounded-full border transition-colors duration-500 ease-maison',
              clair ? 'border-nacre/25 group-hover:border-nacre' : 'border-encre/15 group-hover:border-encre')}>
              <Icone className="h-[17px] w-[17px]" />
            </span>
            {avecTexte && <span className="flex flex-col leading-tight"><span className="label">{nom}</span><span className="text-[13px] opacity-70">{detail}</span></span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
