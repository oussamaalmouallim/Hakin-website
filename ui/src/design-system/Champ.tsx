import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** cloneme: C-23 — champs de la référence (`/auth`) : bordure 1 px `--ligne-forte`, rayon 10 px, `px-4 py-3`, 15 px, encre au focus ;
 *  libellé mono 10 px .2em gris ; erreur mono 10 px rouge. */
const base = 'peer w-full rounded-[10px] border bg-transparent px-4 py-3 font-sans text-[15px] text-encre outline-none placeholder:text-gris-clair transition-colors disabled:opacity-50'
const bordure = (erreur?: string) => (erreur ? 'border-danger focus:border-danger' : 'border-ligne-forte focus:border-encre')

interface Commun { label: string; erreur?: string; aide?: ReactNode; facultatif?: boolean }

function Cadre({ id, label, erreur, aide, facultatif, children }: Commun & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.2em] text-gris">
        {label}{facultatif && <span className="ml-2 normal-case tracking-normal text-gris-clair">(facultatif)</span>}
      </label>
      {children}
      {erreur ? <p id={`${id}-erreur`} role="alert" className="ml-1 mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreur}</p>
        : aide ? <p id={`${id}-aide`} className="text-[13px] text-gris">{aide}</p> : null}
    </div>
  )
}

const decrit = (id: string, erreur?: string, aide?: ReactNode) => (erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined)

export const Champ = forwardRef<HTMLInputElement, Commun & InputHTMLAttributes<HTMLInputElement>>(function Champ(
  { label, erreur, aide, facultatif, className, id, ...rest }, ref) {
  const auto = useId(); const cid = id ?? auto
  return (
    <Cadre id={cid} label={label} erreur={erreur} aide={aide} facultatif={facultatif}>
      <input ref={ref} id={cid} aria-invalid={!!erreur} aria-describedby={decrit(cid, erreur, aide)}
        className={cn(base, bordure(erreur), className)} {...rest} />
    </Cadre>
  )
})

export const ZoneTexte = forwardRef<HTMLTextAreaElement, Commun & TextareaHTMLAttributes<HTMLTextAreaElement>>(function ZoneTexte(
  { label, erreur, aide, facultatif, className, id, rows = 4, ...rest }, ref) {
  const auto = useId(); const cid = id ?? auto
  return (
    <Cadre id={cid} label={label} erreur={erreur} aide={aide} facultatif={facultatif}>
      <textarea ref={ref} id={cid} rows={rows} aria-invalid={!!erreur} aria-describedby={decrit(cid, erreur, aide)}
        className={cn(base, bordure(erreur), 'resize-none', className)} {...rest} />
    </Cadre>
  )
})

export const Selection = forwardRef<HTMLSelectElement, Commun & SelectHTMLAttributes<HTMLSelectElement>>(function Selection(
  { label, erreur, aide, facultatif, className, id, children, ...rest }, ref) {
  const auto = useId(); const cid = id ?? auto
  return (
    <Cadre id={cid} label={label} erreur={erreur} aide={aide} facultatif={facultatif}>
      <div className="relative">
        <select ref={ref} id={cid} aria-invalid={!!erreur} aria-describedby={decrit(cid, erreur, aide)}
          className={cn(base, bordure(erreur), 'appearance-none pr-10', className)} {...rest}>{children}</select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
      </div>
    </Cadre>
  )
})

export function CaseACocher({ label, erreur, ...rest }: { label: ReactNode; erreur?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-[14px] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40">
        <input id={id} type="checkbox" aria-invalid={!!erreur}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-encre"
          {...rest} />
        <span className="flex-1 leading-snug">{label}</span>
      </label>
      {erreur && <p role="alert" className="pl-7 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreur}</p>}
    </div>
  )
}
