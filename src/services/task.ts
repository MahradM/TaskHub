import { supabase } from '../lib/supabase'
import type { Task, TaskFilters } from '../types'

export interface TaskInput { title: string; description?: string; project_id: string; workspace_id: string; due_date?: string | null; priority: string; status: string; assignee_user_id: string | null; assigned_to_workspace: boolean }

export const taskService = {
  async list(workspaceId: string, filters?: Partial<TaskFilters>) {
    let query = supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_user_id_fkey(*), project:projects(id,title)').eq('workspace_id', workspaceId)
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
    if (filters?.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
    if (filters?.projectId) query = query.eq('project_id', filters.projectId)
    if (filters?.assignee === 'workspace') query = query.eq('assigned_to_workspace', true)
    else if (filters?.assignee) query = query.eq('assignee_user_id', filters.assignee)
    if (filters?.search) query = query.or(`title.ilike.%${filters.search.replace(/[,%]/g, '')}%,description.ilike.%${filters.search.replace(/[,%]/g, '')}%`)
    if (filters?.sort === 'due_asc') query = query.order('due_date', { ascending: true, nullsFirst: false })
    else if (filters?.sort === 'due_desc') query = query.order('due_date', { ascending: false, nullsFirst: false })
    else if (filters?.sort === 'title') query = query.order('title')
    else query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Task[]
  },
  async create(input: TaskInput) { const { data, error } = await supabase.from('tasks').insert(input).select().single(); if (error) throw error; return data as Task },
  async update(id: string, input: Partial<TaskInput>) { const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select().single(); if (error) throw error; return data as Task },
  async remove(id: string) { const { error } = await supabase.from('tasks').delete().eq('id', id); if (error) throw error },
}
