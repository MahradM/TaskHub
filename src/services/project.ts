import { supabase } from '../lib/supabase'
import type { Project } from '../types'

export const projectService = {
  async list(workspaceId: string) { const { data, error } = await supabase.from('projects').select('*').eq('workspace_id', workspaceId).order('updated_at', { ascending: false }); if (error) throw error; return data as Project[] },
  async get(id: string) { const { data, error } = await supabase.from('projects').select('*').eq('id', id).single(); if (error) throw error; return data as Project },
  async create(workspaceId: string, input: { title: string; description?: string; status?: string }) { const { data, error } = await supabase.from('projects').insert({ ...input, workspace_id: workspaceId }).select().single(); if (error) throw error; return data as Project },
  async update(id: string, input: Partial<Project>) { const { data, error } = await supabase.from('projects').update(input).eq('id', id).select().single(); if (error) throw error; return data as Project },
  async remove(id: string) { const { data: files, error: fileQueryError } = await supabase.from('files').select('storage_path').eq('project_id', id); if (fileQueryError) throw fileQueryError; if (files?.length) { const { error: storageError } = await supabase.storage.from('project-files').remove(files.map((file) => file.storage_path)); if (storageError) throw storageError } const { error } = await supabase.from('projects').delete().eq('id', id); if (error) throw error },
}
