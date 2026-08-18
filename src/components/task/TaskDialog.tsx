import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { messageFromError } from '../../lib/utils'
import { taskSchema } from '../../lib/validations'
import { taskService } from '../../services/task'
import type { Member, Project, Task } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type FormData = z.infer<typeof taskSchema>

export function TaskDialog({ open, onClose, workspaceId, projects, members, task, defaultProjectId }: { open: boolean; onClose: () => void; workspaceId: string; projects: Project[]; members: Member[]; task?: Task; defaultProjectId?: string }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(taskSchema) })
  useEffect(() => { reset({ title: task?.title || '', description: task?.description || '', project_id: task?.project_id || defaultProjectId || projects[0]?.id || '', due_date: task?.due_date?.slice(0, 10) || '', priority: task?.priority || 'medium', status: task?.status || 'todo', assignment: task?.assigned_to_workspace ? 'workspace' : task?.assignee_user_id || 'unassigned' }) }, [task, defaultProjectId, projects, reset, open])
  const submit = async (values: FormData) => {
    const input = { ...values, workspace_id: workspaceId, due_date: values.due_date || null, assignee_user_id: !['workspace', 'unassigned'].includes(values.assignment) ? values.assignment : null, assigned_to_workspace: values.assignment === 'workspace' }
    try { if (task) await taskService.update(task.id, input); else await taskService.create(input); await queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success(task ? 'Task updated' : 'Task created'); onClose() } catch (error) { toast.error(messageFromError(error)) }
  }
  const remove = async () => {
    if (!task || !confirm(`Delete “${task.title}”?`)) return
    try { await taskService.remove(task.id); await queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); onClose() } catch (error) { toast.error(messageFromError(error)) }
  }
  return <Dialog open={open} onClose={onClose} title={task ? 'Edit task' : 'Create task'} wide><form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">Task title</label><input className="input" autoFocus {...register('title')}/>{errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}</div><div className="sm:col-span-2"><label className="label">Description</label><textarea className="textarea" {...register('description')}/></div><div><label className="label">Project</label><select className="input" {...register('project_id')}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>{errors.project_id && <p className="mt-1 text-xs text-red-600">Choose a project</p>}</div><div><label className="label">Due date</label><input className="input" type="date" {...register('due_date')}/></div><div><label className="label">Priority</label><select className="input" {...register('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div><label className="label">Status</label><select className="input" {...register('status')}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div><div className="sm:col-span-2"><label className="label">Assign to</label><select className="input" {...register('assignment')}><option value="unassigned">Unassigned</option><option value="workspace">Everyone in the workspace</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile?.full_name || member.profile?.username}</option>)}</select></div><div className="flex items-center justify-between gap-2 pt-2 sm:col-span-2"><div>{task && <Button type="button" variant="danger" onClick={() => void remove()}>Delete task</Button>}</div><div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{task ? 'Save changes' : 'Create task'}</Button></div></div></form></Dialog>
}
