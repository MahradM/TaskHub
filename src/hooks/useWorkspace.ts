import { useQuery } from '@tanstack/react-query'
import { workspaceService } from '../services/workspace'
export const useWorkspaces = () => useQuery({ queryKey: ['workspaces'], queryFn: workspaceService.list })
export const useWorkspace = (id?: string) => useQuery({ queryKey: ['workspace', id], queryFn: () => workspaceService.get(id!), enabled: Boolean(id) })
export const useMembers = (id?: string) => useQuery({ queryKey: ['members', id], queryFn: () => workspaceService.members(id!), enabled: Boolean(id) })
