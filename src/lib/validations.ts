import { z } from 'zod'

export const usernameSchema = z.string().min(3, 'Use at least 3 characters').max(32, 'Use 32 characters or fewer').regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only')
export const passwordSchema = z.string().min(8, 'Use at least 8 characters')
export const loginSchema = z.object({ username: usernameSchema, password: passwordSchema })
export const registerSchema = z.object({ username: usernameSchema, fullName: z.string().min(2).max(80), password: passwordSchema })
export const profileSchema = z.object({ username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/), full_name: z.string().min(2).max(80), avatar_url: z.union([z.url(), z.literal('')]) })
export const workspaceSchema = z.object({ name: z.string().min(2).max(80), description: z.string().max(500).optional() })
export const projectSchema = z.object({ title: z.string().min(2).max(120), description: z.string().max(1000).optional(), status: z.enum(['active', 'archived']) })
export const taskSchema = z.object({ title: z.string().min(2).max(160), description: z.string().max(3000).optional(), project_id: z.string().uuid(), due_date: z.string().optional(), priority: z.enum(['low', 'medium', 'high', 'urgent']), status: z.enum(['todo', 'in_progress', 'done']), assignment: z.string() })
export const inviteSchema = z.object({ identifier: usernameSchema })
export const changePasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((values) => values.password === values.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
