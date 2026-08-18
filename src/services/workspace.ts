import { supabase } from '../lib/supabase'
import type { Invitation, Member, Workspace, WorkspaceRole } from '../types'

export const workspaceService = {
  async list() {
    const { data, error } = await supabase.from('workspace_members').select('role, workspace:workspaces(*)').order('created_at')
    if (error) throw error
    return (data ?? []).map((row) => ({ ...(row.workspace as unknown as Workspace), role: row.role as WorkspaceRole }))
  },
  async get(id: string) {
    const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single()
    if (error) throw error
    return data as Workspace
  },
  async create(input: { name: string; description?: string }) {
    const { data, error } = await supabase.rpc('create_workspace', {
      workspace_name: input.name,
      workspace_description: input.description || null,
    }).single()
    if (error) throw error
    return data as Workspace
  },
  async update(id: string, input: Partial<Pick<Workspace, 'name' | 'description'>>) {
    const { data, error } = await supabase.from('workspaces').update(input).eq('id', id).select().single()
    if (error) throw error
    return data as Workspace
  },
  async remove(id: string) { const { data: files, error: fileQueryError } = await supabase.from('files').select('storage_path').eq('workspace_id', id); if (fileQueryError) throw fileQueryError; if (files?.length) { const { error: storageError } = await supabase.storage.from('project-files').remove(files.map((file) => file.storage_path)); if (storageError) throw storageError } const { error } = await supabase.from('workspaces').delete().eq('id', id); if (error) throw error },
  async members(workspaceId: string) {
    const { data, error } = await supabase.from('workspace_members').select('*, profile:profiles(*)').eq('workspace_id', workspaceId).order('created_at')
    if (error) throw error
    return data as unknown as Member[]
  },
  async updateRole(memberId: string, role: WorkspaceRole) { const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId); if (error) throw error },
  async removeMember(memberId: string) { const { error } = await supabase.from('workspace_members').delete().eq('id', memberId); if (error) throw error },
  async invite(workspaceId: string, identifier: string) {
    const { error } = await supabase.rpc('invite_to_workspace', { target_workspace_id: workspaceId, identifier })
    if (error) throw error
  },
  async invitations() {
    const { data, error } = await supabase.from('workspace_invitations').select('*, workspace:workspaces(name)').eq('status', 'pending').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
    if (error) throw error
    return data as unknown as Invitation[]
  },
  async respond(invitationId: string, accept: boolean) {
    const { error } = await supabase.rpc('respond_to_invitation', { invitation_id: invitationId, accept_invitation: accept })
    if (error) throw error
  },
}
