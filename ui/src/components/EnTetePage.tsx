import type { ReactNode } from 'react'
import { FilAriane, Revelation } from '@/design-system'

/** En-tête éditorial des pages intérieures (sous la barre fixe). */
export function EnTetePage({ surtitre, titre, texte, ariane, aDroite }: {
  surtitre?: string; titre: ReactNode; texte?: ReactNode; ariane?: { libelle: string; vers?: string }[]; aDroite?: ReactNode
}) {
  return (
    <section className="conteneur pb-10 pt-[calc(var(--nav-h)+3rem)] lg:pb-14 lg:pt-36">
      {ariane && <div className="mb-8"><FilAriane elements={ariane} /></div>}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <Revelation className="max-w-3xl">
          {surtitre && <p className="label mb-5 text-bronze">{surtitre}</p>}
          <h1 className="titre-1 equilibre">{titre}</h1>
          {texte && <p className="mt-6 max-w-xl text-[17px] text-gris">{texte}</p>}
        </Revelation>
        {aDroite}
      </div>
    </section>
  )
}
