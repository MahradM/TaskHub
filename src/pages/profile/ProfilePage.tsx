import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import { initials, messageFromError } from '../../lib/utils'
import { profileSchema } from '../../lib/validations'
import { supabase } from '../../lib/supabase'

type FormData = z.infer<typeof profileSchema>
export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(profileSchema), defaultValues: { username: '', full_name: '', avatar_url: '' } })
  useEffect(() => { if (profile) reset({ username: profile.username, full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' }) }, [profile, reset])
  const submit = async (values: FormData) => { try { const { error } = await supabase.from('profiles').update({ ...values, avatar_url: values.avatar_url || null }).eq('id', user!.id); if (error) throw error; await refreshProfile(); toast.success('Profile updated') } catch (error) { toast.error(messageFromError(error)) } }
  const avatar = watch('avatar_url')
  const name = watch('full_name') || watch('username')
  return <div className="animate-enter max-w-3xl"><PageHeader eyebrow="Account" title="Your profile" description="Keep your identity recognizable to the people you work with."/><div className="card p-6 sm:p-8"><div className="mb-8 flex items-center gap-5 border-b pb-7"><span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-500/15">{avatar ? <img src={avatar} alt="Profile preview" className="size-full object-cover"/> : initials(name)}</span><div><p className="font-bold">{name || 'Your profile'}</p><p className="subtle mt-1">@{watch('username')}</p></div></div><form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(submit)}><div><label className="label">Full name</label><input className="input" {...register('full_name')}/>{errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}</div><div><label className="label">Username</label><input className="input cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-950" readOnly {...register('username')}/><p className="mt-1 text-xs text-slate-500">Your sign-in username cannot be changed.</p>{errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}</div><div className="sm:col-span-2"><label className="label">Avatar image URL</label><input className="input" placeholder="https://…" {...register('avatar_url')}/>{errors.avatar_url && <p className="mt-1 text-xs text-red-600">{errors.avatar_url.message}</p>}<p className="mt-2 text-xs text-slate-500">Use a secure HTTPS image URL.</p></div><div className="sm:col-span-2"><Button type="submit" loading={isSubmitting}>Save profile</Button></div></form></div></div>
}
