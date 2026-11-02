import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const classeChamp = (erreur?: string) => cn('w-full rounded-[10px] border bg-transparent px-4 py-3 text-[15px] text-encre outline-none transition-colors',
  erreur ? 'border-danger' : 'border-ligne-forte focus:border-encre')
function Libelle({ id, label, facultatif }: { id: string; label: string; facultatif?: boolean }) {
  return <label htmlFor={id} className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gris">{label}{facultatif && <span className="normal-case tracking-normal"> (facultatif)</span>}</label>
}
function Erreur({ id, erreur }: { id: string; erreur?: string }) {
  return erreur ? <p id={`${id}-e`} className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreur}</p> : null
}

/** cloneme: C-26 — champ de la page d'authentification de la référence : libellé mono 10 px .2em gris, champ `px-4 py-3`
 *  rayon 10 px, filet fort puis encre au focus ; erreur = filet rouge + message mono 10 px .15em rouge en capitales.
 *  Repris tel quel par le checkout de la référence (`/checkout`). */
export function ChampLigne({ label, erreur, motDePasse, facultatif, ...p }: { label: string; erreur?: string; motDePasse?: boolean; facultatif?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const champ = (
    <input id={id} {...p} type={motDePasse ? (visible ? 'text' : 'password') : p.type}
      aria-invalid={erreur ? true : undefined} aria-describedby={erreur ? `${id}-e` : undefined}
      className={cn(classeChamp(erreur), motDePasse && 'pr-12')} />
  )
  return (
    <div>
      <Libelle id={id} label={label} facultatif={facultatif} />
      {motDePasse ? (
        <div className="relative">
          {champ}
          <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gris transition-colors hover:text-encre">
            {visible ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          </button>
        </div>
      ) : champ}
      <Erreur id={id} erreur={erreur} />
    </div>
  )
}

/** Liste déroulante au même style (ville de livraison). */
export function SelectionLigne({ label, erreur, children, ...p }: { label: string; erreur?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div>
      <Libelle id={id} label={label} />
      <div className="relative">
        <select id={id} {...p} aria-invalid={erreur ? true : undefined} aria-describedby={erreur ? `${id}-e` : undefined} className={cn(classeChamp(erreur), 'cursor-pointer appearance-none pr-10')}>{children}</select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" strokeWidth={1.75} />
      </div>
      <Erreur id={id} erreur={erreur} />
    </div>
  )
}

/** Zone de texte au même style (instructions de livraison). */
export function ZoneLigne({ label, facultatif, ...p }: { label: string; facultatif?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div>
      <Libelle id={id} label={label} facultatif={facultatif} />
      <textarea id={id} {...p} className={cn(classeChamp(), 'resize-y')} />
    </div>
  )
}
