import type { ReactNode } from 'react'
import { AConfirmer } from '@/design-system'
import { boutique } from '@/lib/catalogue'
import { formatDH } from '@/lib/format'

export function Recapitulatif({ sousTotalDH, nbArticles, children }: { sousTotalDH: number; nbArticles: number; children?: ReactNode }) {
  return (
    <div className="bg-sable-50 p-6 sm:p-8">
      <h2 className="label-large mb-6">Récapitulatif</h2>
      <dl className="flex flex-col gap-4 text-[15px]">
        <div className="flex justify-between"><dt>Sous-total · {nbArticles} article{nbArticles > 1 ? 's' : ''}</dt><dd className="tabular-nums">{formatDH(sousTotalDH)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Livraison</dt><dd className="text-right">{boutique.livraison.fraisDH != null ? formatDH(boutique.livraison.fraisDH) : <AConfirmer>Calculée à la confirmation</AConfirmer>}</dd></div>
        <div className="flex justify-between border-t border-encre/10 pt-4 text-[17px]"><dt>Total estimé</dt><dd className="tabular-nums">{formatDH(sousTotalDH + (boutique.livraison.fraisDH ?? 0))}</dd></div>
      </dl>
      <p className="mt-4 text-[13px] text-gris">{boutique.paiement}. Commande confirmée avec vous sur WhatsApp.</p>
      {children && <div className="mt-8 flex flex-col gap-3">{children}</div>}
    </div>
  )
}
