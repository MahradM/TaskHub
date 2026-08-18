import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { messageFromError } from '../../lib/utils'
import { loginSchema } from '../../lib/validations'

type FormData = z.infer<typeof loginSchema>
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(loginSchema) })
  const submit = async (values: FormData) => { try { await signIn(values.username, values.password); toast.success('Welcome back'); navigate((location.state as { from?: string } | null)?.from || '/dashboard', { replace: true }) } catch (error) { toast.error(messageFromError(error)) } }
  return <div className="animate-enter"><p className="mb-2 text-sm font-semibold text-brand-600">WELCOME BACK</p><h1 className="text-3xl font-bold tracking-tight">Sign in to TaskHub</h1><p className="subtle mt-2">Pick up right where your team left off.</p><form className="mt-8 space-y-5" onSubmit={handleSubmit(submit)}><div><label className="label" htmlFor="username">Username</label><input id="username" className="input" autoComplete="username" autoCapitalize="none" placeholder="your_username" {...register('username')}/>{errors.username && <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>}</div><div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')}/>{errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}</div><Button type="submit" className="w-full" loading={isSubmitting}>Sign in <ArrowRight className="size-4"/></Button></form><p className="mt-7 text-center text-sm text-slate-500">New to TaskHub? <Link className="font-semibold text-brand-600 hover:underline" to="/register">Create an account</Link></p></div>
}
