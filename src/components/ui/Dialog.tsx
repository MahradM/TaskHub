import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Dialog({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return createPortal(<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}><div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="dialog-title" className="text-xl font-bold">{title}</h2>{description && <p className="subtle mt-1">{description}</p>}</div><button aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-5" /></button></div>{children}</div></div>, document.body)
}
