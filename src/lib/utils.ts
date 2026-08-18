import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
export const formatDate = (value?: string | null) => value ? format(new Date(value), 'MMM d, yyyy') : 'No due date'
export const timeAgo = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true })
export const isOverdue = (value?: string | null) => Boolean(value && isPast(new Date(value)))
export const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
export const initials = (name?: string | null) => (name || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
export const messageFromError = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message
  return 'Something went wrong. Please try again.'
}
