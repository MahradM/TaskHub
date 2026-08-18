import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { messageFromError } from '../../lib/utils'
import { registerSchema } from '../../lib/validations'

type FormData = z.infer<typeof registerSchema>
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(registerSchema) })
  const submit = async (values: FormData) => { try { await signUp(values.username, values.password, values.fullName); toast.success('Your account is ready'); navigate('/dashboard') } catch (error) { toast.error(messageFromError(error)) } }
  return <div className="animate-enter"><p className="mb-2 text-sm font-semibold text-brand-600">GET STARTED</p><h1 className="text-3xl font-bold tracking-tight">Create your account</h1><p className="subtle mt-2">No email verification—just choose a username and password.</p><form className="mt-7 space-y-4" onSubmit={handleSubmit(submit)}><div><label className="label" htmlFor="fullName">Full name</label><input id="fullName" className="input" autoComplete="name" {...register('fullName')}/>{errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}</div><div><label className="label" htmlFor="username">Username</label><input id="username" className="input" autoComplete="username" autoCapitalize="none" placeholder="letters, numbers, underscores" {...register('username')}/>{errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}</div><div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" autoComplete="new-password" {...register('password')}/>{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}</div><Button type="submit" className="mt-1 w-full" loading={isSubmitting}>Create account <ArrowRight className="size-4"/></Button></form><p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-brand-600 hover:underline" to="/login">Sign in</Link></p></div>
}
