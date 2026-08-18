import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'icon'; loading?: boolean; children: ReactNode }
export function Button({ variant = 'primary', size = 'md', loading, className, disabled, children, ...props }: Props) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50', variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500/20', variant === 'secondary' && 'border bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800', variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-800', variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-100 dark:bg-red-950/40 dark:text-red-300', size === 'sm' && 'h-9 px-3 text-sm', size === 'md' && 'h-11 px-4 text-sm', size === 'icon' && 'size-10', className)} disabled={disabled || loading} {...props}>{loading && <LoaderCircle className="size-4 animate-spin" />}{children}</button>
}
