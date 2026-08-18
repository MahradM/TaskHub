import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { messageFromError } from '../../lib/utils'
import { workspaceSchema } from '../../lib/validations'
import { workspaceService } from '../../services/workspace'
import type { Workspace } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type FormData = z.infer<typeof workspaceSchema>
export function WorkspaceDialog({ open, onClose, workspace }: { open: boolean; onClose: () => void; workspace?: Workspace }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(workspaceSchema), defaultValues: { name: '', description: '' } })
  useEffect(() => { reset({ name: workspace?.name || '', description: workspace?.description || '' }) }, [workspace, reset, open])
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  const submit = async (values: FormData) => { try { if (workspace) await workspaceService.update(workspace.id, values); else await workspaceService.create(values); await refresh(); toast.success(workspace ? 'Workspace updated' : 'Workspace created'); onClose() } catch (error) { toast.error(messageFromError(error)) } }
  const remove = async () => { if (!workspace || !confirm(`Delete “${workspace.name}” and all of its projects, tasks, and files?`)) return; try { await workspaceService.remove(workspace.id); await refresh(); toast.success('Workspace deleted'); onClose() } catch (error) { toast.error(messageFromError(error)) } }
  return <Dialog open={open} onClose={onClose} title={workspace ? 'Edit workspace' : 'Create a workspace'} description="Give your team a clear home for projects, people, and files."><form onSubmit={handleSubmit(submit)} className="space-y-4"><div><label className="label">Workspace name</label><input className="input" autoFocus placeholder="e.g. Product & Design" {...register('name')}/>{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}</div><div><label className="label">Description</label><textarea className="textarea" placeholder="What does this team work on?" {...register('description')}/>{errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}</div><div className="flex items-center justify-between gap-2 pt-2"><div>{workspace?.role === 'owner' && <Button type="button" variant="danger" onClick={() => void remove()}>Delete workspace</Button>}</div><div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{workspace ? 'Save changes' : 'Create workspace'}</Button></div></div></form></Dialog>
}
