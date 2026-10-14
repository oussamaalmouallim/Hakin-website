import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const base = 'peer w-full rounded-none border-0 border-b bg-transparent px-0 pb-2.5 pt-2 font-sans text-[15px] font-light text-encre placeholder:text-gris-clair transition-colors duration-300 focus:outline-none focus:ring-0 disabled:opacity-50'
const bordure = (erreur?: string) => (erreur ? 'border-erreur focus:border-erreur' : 'border-ligne focus:border-encre')

interface Commun { label: string; erreur?: string; aide?: ReactNode; facultatif?: boolean }

function Cadre({ id, label, erreur, aide, facultatif, children }: Commun & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label text-gris">
        {label}{facultatif && <span className="ml-2 normal-case tracking-normal text-gris-clair">(facultatif)</span>}
      </label>
      {children}
      {erreur ? <p id={`${id}-erreur`} role="alert" className="text-[13px] text-erreur">{erreur}</p>
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
          className={cn(base, bordure(erreur), 'appearance-none pr-8', className)} {...rest}>{children}</select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" aria-hidden />
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
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-fin border border-encre/40 bg-neige transition-colors checked:border-encre checked:bg-encre checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M4 8.5l2.5 2.5L12 5.5%22 stroke=%22%23FBF9F5%22 stroke-width=%221.6%22 fill=%22none%22/></svg>')]"
          {...rest} />
        <span className="flex-1 leading-snug">{label}</span>
      </label>
      {erreur && <p role="alert" className="pl-7 text-[13px] text-erreur">{erreur}</p>}
    </div>
  )
}
