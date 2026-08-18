import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { messageFromError } from '../../lib/utils'
import { projectSchema } from '../../lib/validations'
import { projectService } from '../../services/project'
import type { Project } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
type FormData = z.infer<typeof projectSchema>
export function ProjectDialog({ open, onClose, workspaceId, project }: { open: boolean; onClose: () => void; workspaceId: string; project?: Project }) { const queryClient = useQueryClient(); const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(projectSchema), defaultValues: { title: '', description: '', status: 'active' } }); useEffect(() => { reset({ title: project?.title || '', description: project?.description || '', status: project?.status || 'active' }) }, [project, reset, open]); const submit = async (values: FormData) => { try { if (project) await projectService.update(project.id, values); else await projectService.create(workspaceId, values); await queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }); toast.success(project ? 'Project updated' : 'Project created'); onClose() } catch (error) { toast.error(messageFromError(error)) } }; return <Dialog open={open} onClose={onClose} title={project ? 'Edit project' : 'New project'}><form onSubmit={handleSubmit(submit)} className="space-y-4"><div><label className="label">Project title</label><input className="input" autoFocus placeholder="e.g. Fall product launch" {...register('title')}/>{errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}</div><div><label className="label">Description</label><textarea className="textarea" {...register('description')}/></div>{project && <div><label className="label">Status</label><select className="input" {...register('status')}><option value="active">Active</option><option value="archived">Archived</option></select></div>}<div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{project ? 'Save changes' : 'Create project'}</Button></div></form></Dialog> }
