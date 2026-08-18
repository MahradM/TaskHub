import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, KeyRound, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { messageFromError } from '../../lib/utils'
import { changePasswordSchema } from '../../lib/validations'

type PasswordForm = z.infer<typeof changePasswordSchema>
export function SettingsPage() {
  const { changePassword } = useAuth()
  const { theme, toggle } = useTheme()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({ resolver: zodResolver(changePasswordSchema) })
  const updatePassword = async (values: PasswordForm) => { try { await changePassword(values.password); reset(); toast.success('Password updated') } catch (error) { toast.error(messageFromError(error)) } }
  return <div className="animate-enter max-w-3xl"><PageHeader eyebrow="Preferences" title="Settings" description="Control how TaskHub looks and keep your account secure."/><div className="space-y-5"><section className="card p-6"><div className="flex items-start gap-4"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10"><Monitor className="size-5"/></span><div className="flex-1"><h2 className="font-bold">Appearance</h2><p className="subtle mt-1">Choose the theme that feels best for your environment.</p><button onClick={toggle} className="mt-5 flex w-full items-center justify-between rounded-xl border p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><span className="flex items-center gap-3">{theme === 'dark' ? <Moon className="size-5"/> : <Sun className="size-5"/>}<span className="text-sm font-semibold capitalize">{theme} mode</span></span><span className="text-xs text-slate-500">Click to switch</span></button></div></div></section><section className="card p-6"><div className="flex items-start gap-4"><span className="rounded-xl bg-teal-50 p-2.5 text-teal-600 dark:bg-teal-950"><ShieldCheck className="size-5"/></span><div className="min-w-0 flex-1"><h2 className="font-bold">Account security</h2><p className="subtle mt-1">Set a new password for your username-based account.</p><form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(updatePassword)}><div><label className="label">New password</label><input className="input" type="password" autoComplete="new-password" {...register('password')}/>{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}</div><div><label className="label">Confirm password</label><input className="input" type="password" autoComplete="new-password" {...register('confirmPassword')}/>{errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}</div><div className="sm:col-span-2"><Button variant="secondary" type="submit" loading={isSubmitting}><KeyRound className="size-4"/>Update password</Button></div></form></div></div></section><section className="card p-6 opacity-70"><div className="flex items-start gap-4"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950"><Bell className="size-5"/></span><div><h2 className="font-bold">Notifications</h2><p className="subtle mt-1">Workspace activity updates appear in realtime inside TaskHub. This username-based setup does not send authentication email.</p></div></div></section></div></div>
}
