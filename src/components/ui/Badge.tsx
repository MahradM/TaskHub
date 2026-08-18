import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: 'slate' | 'indigo' | 'green' | 'amber' | 'red' | 'teal'; className?: string }) {
  const tones = { slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300', teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>
}
