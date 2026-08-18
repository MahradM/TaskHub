import { supabase } from '../lib/supabase'

const INTERNAL_AUTH_DOMAIN = 'users.taskhub.internal'
const authEmailForUsername = (username: string) => `${username.trim().toLowerCase()}@${INTERNAL_AUTH_DOMAIN}`

export const authService = {
  signIn: (username: string, password: string) => supabase.auth.signInWithPassword({ email: authEmailForUsername(username), password }),
  signUp: (username: string, password: string, fullName: string) => supabase.auth.signUp({ email: authEmailForUsername(username), password, options: { data: { username: username.trim(), full_name: fullName } } }),
  signOut: () => supabase.auth.signOut(),
  changePassword: (password: string) => supabase.auth.updateUser({ password }),
}
