/**
 * Adapté de Lightswind UI — « table » (licence MIT, https://lightswind.com/components/table).
 * Tableau dense de l'admin : en-tête sur fond doux, lignes séparées par un filet, survol discret, chiffres alignés.
 * Le conteneur défile horizontalement sur petit écran (jamais la page entière). Tri et pagination : à la charge de l'écran.
 */
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement> & { minWidth?: number; cadre?: boolean }>(function Table(
  { className, minWidth, cadre = true, ...props }, ref) {
  return (
    // tabIndex : un tableau qui défile horizontalement doit pouvoir défiler au clavier (WCAG, règle axe scrollable-region-focusable).
    <div tabIndex={0} className={cn('relative w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-admin-accent', cadre && 'rounded-bloc border border-ligne')}>
      <table ref={ref} style={minWidth ? { minWidth } : undefined} className={cn('w-full caption-bottom border-collapse text-left text-[13px]', className)} {...props} />
    </div>
  )
})

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('bg-fond-3/70 [&_tr]:border-b [&_tr]:border-ligne', className)} {...props} />
})

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
})

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow({ className, ...props }, ref) {
  return <tr ref={ref} className={cn('border-b border-ligne transition-colors hover:bg-fond-3/40', className)} {...props} />
})

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHead({ className, ...props }, ref) {
  return <th ref={ref} scope="col" className={cn('h-9 whitespace-nowrap px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-gris first:pl-4 last:pr-4', className)} {...props} />
})

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn('px-3 py-2.5 align-middle first:pl-4 last:pr-4', className)} {...props} />
})

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn('mt-3 px-4 pb-3 text-left text-[12px] text-gris', className)} {...props} />
})
