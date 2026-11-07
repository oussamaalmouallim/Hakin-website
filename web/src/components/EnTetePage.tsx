import type { ReactNode } from 'react'
import { FilAriane, Revelation } from '@/design-system'

/** cloneme: C-22 — en-tête des pages intérieures sur le modèle de la référence : `pt-20`, fil d'Ariane mono (fiche produit),
 *  surtitre à filet, titre Archivo Black clamp(36–56 px) interligne .92 (titre de la fiche produit), filet bas (bandeau de `/shop`). */
export function EnTetePage({ surtitre, titre, texte, ariane, aDroite }: {
  surtitre?: string; titre: ReactNode; texte?: ReactNode; ariane?: { libelle: string; vers?: string }[]; aDroite?: ReactNode
}) {
  return (
    <section className="border-b border-ligne pt-20">
      {ariane && <div className="px-5 py-4 md:px-14"><FilAriane elements={ariane} /></div>}
      <div className="flex flex-col justify-between gap-6 px-5 pb-8 pt-4 md:px-14 lg:flex-row lg:items-end">
        <Revelation className="max-w-3xl">
          {surtitre && surtitre !== titre && <p className="surtitre text-gris">{surtitre}</p>}
          <h1 className="font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.92] tracking-[-0.02em] equilibre">{titre}</h1>
          {texte && <p className="mt-4 max-w-xl text-[15px] leading-[1.62] text-gris">{texte}</p>}
        </Revelation>
        {aDroite}
      </div>
    </section>
  )
}
