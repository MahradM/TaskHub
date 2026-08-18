export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type ProjectStatus = 'active' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface Profile { id: string; email: string; username: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string }
export interface Workspace { id: string; name: string; description: string | null; owner_id: string; created_at: string; updated_at: string; role?: WorkspaceRole }
export interface Member { id: string; workspace_id: string; user_id: string; role: WorkspaceRole; created_at: string; profile?: Profile }
export interface Invitation { id: string; workspace_id: string; invited_user_id: string | null; invited_email: string | null; invited_by: string; status: InvitationStatus; created_at: string; expires_at: string; workspace?: Pick<Workspace, 'name'>; inviter?: Pick<Profile, 'full_name' | 'username'> }
export interface Project { id: string; workspace_id: string; title: string; description: string | null; status: ProjectStatus; created_by: string; created_at: string; updated_at: string }
export interface Task { id: string; project_id: string; workspace_id: string; title: string; description: string | null; due_date: string | null; priority: TaskPriority; status: TaskStatus; assignee_user_id: string | null; assigned_to_workspace: boolean; created_by: string; created_at: string; updated_at: string; assignee?: Profile | null; project?: Pick<Project, 'id' | 'title'> }
export interface ProjectFile { id: string; project_id: string; workspace_id: string; uploaded_by: string; file_name: string; storage_path: string; file_size: number; mime_type: string; created_at: string; uploader?: Profile }
export interface TaskFilters { search: string; status: TaskStatus | 'all'; priority: TaskPriority | 'all'; projectId: string; assignee: string; sort: 'created_desc' | 'due_asc' | 'due_desc' | 'title' }
