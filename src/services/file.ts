import { supabase } from '../lib/supabase'
import type { ProjectFile } from '../types'

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip', 'txt']
export const MAX_FILE_SIZE = 25 * 1024 * 1024
const MIME_BY_EXTENSION: Record<string, string> = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', zip: 'application/zip', txt: 'text/plain' }

export const fileService = {
  async list(projectId: string) { const { data, error } = await supabase.from('files').select('*, uploader:profiles!files_uploaded_by_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }); if (error) throw error; return data as unknown as ProjectFile[] },
  async upload(file: File, projectId: string, workspaceId: string, userId: string, onProgress?: (value: number) => void) {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) throw new Error('This file type is not supported.')
    if (file.size === 0) throw new Error('Empty files cannot be uploaded.')
    if (file.size > MAX_FILE_SIZE) throw new Error('Files must be smaller than 25 MB.')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `projects/${projectId}/${userId}/${crypto.randomUUID()}-${safeName}`
    onProgress?.(20)
    const mimeType = MIME_BY_EXTENSION[extension]
    const { error: uploadError } = await supabase.storage.from('project-files').upload(path, file, { contentType: mimeType, upsert: false })
    if (uploadError) throw uploadError
    onProgress?.(75)
    const { data, error } = await supabase.from('files').insert({ project_id: projectId, workspace_id: workspaceId, uploaded_by: userId, file_name: file.name, storage_path: path, file_size: file.size, mime_type: mimeType }).select().single()
    if (error) { await supabase.storage.from('project-files').remove([path]); throw error }
    onProgress?.(100)
    return data as ProjectFile
  },
  async download(file: ProjectFile) { const { data, error } = await supabase.storage.from('project-files').createSignedUrl(file.storage_path, 60); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener,noreferrer') },
  async remove(file: ProjectFile) { const { error } = await supabase.storage.from('project-files').remove([file.storage_path]); if (error) throw error; const { error: metadataError } = await supabase.from('files').delete().eq('id', file.id); if (metadataError) throw metadataError },
}
