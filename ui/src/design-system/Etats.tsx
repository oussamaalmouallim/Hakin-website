import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Squelette({ className }: { className?: string }) {
  return <div className={cn('relative overflow-hidden bg-sable-50 before:absolute before:inset-0 before:-translate-x-full before:animate-[defiler_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-neige/60 before:to-transparent', className)} aria-hidden />
}

export function SqueletteCarte() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Squelette className="aspect-[4/5] w-full" />
      <Squelette className="h-3 w-1/3" />
      <Squelette className="h-4 w-2/3" />
    </div>
  )
}

export function EtatVide({ titre, texte, action, icone }: { titre: string; texte?: ReactNode; action?: ReactNode; icone?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-20 text-center">
      {icone && <div className="text-bronze">{icone}</div>}
      <p className="filet-etoile" aria-hidden>✦</p>
      <h2 className="titre-2">{titre}</h2>
      {texte && <p className="texte-doux">{texte}</p>}
      {action}
    </div>
  )
}

export function EtatErreur({ titre = 'Un incident est survenu', texte, action }: { titre?: string; texte?: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 border border-erreur/20 bg-neige px-8 py-12 text-center">
      <p className="label text-erreur">Erreur</p>
      <h2 className="titre-3">{titre}</h2>
      {texte && <p className="texte-doux">{texte}</p>}
      {action}
    </div>
  )
}

export function AConfirmer({ children = 'À confirmer' }: { children?: ReactNode }) {
  return <span className="inline-flex items-start gap-1.5 text-gris"><span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-or" aria-hidden />{children}</span>
}
