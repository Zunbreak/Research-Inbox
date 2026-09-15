export type LinkStatus = 'inbox' | 'archive' | 'trash'

export type BackupState = 'loading' | 'active' | 'saving' | 'offline' | 'error'

export type LinkSource = 'paste' | 'import' | 'extension' | 'manual'

export interface LinkItem {
  id: string
  url: string
  title: string
  domain: string
  capturedAt: string
  status: LinkStatus
  project: string
  tags: string[]
  whySaved: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  headings?: string[]
  selectedText?: string
  source?: LinkSource
  capturedFrom?: string
}

export interface CaptureLinkInput {
  url: string
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  headings?: string[]
  selectedText?: string
  source?: LinkSource
  capturedFrom?: string
  project?: string
  tags?: string[]
  whySaved?: string
}

export interface CaptureLinkResult {
  success: boolean
  status: 'created' | 'duplicate' | 'invalid'
  id?: string
  message: string
}

export interface FilterState {
  search: string
  status: LinkStatus | 'all'
  project: string
  tag: string
  domain: string
}

export interface CaptureResult {
  added: number
  duplicates: number
  invalid: number
}

export type ImportBackupResult =
  | { mode: 'merge'; added: number; alreadyExisted: number }
  | { mode: 'replace'; total: number }

export interface BackupPayload {
  version: 1
  savedAt: string | null
  links: LinkItem[]
  recentProjects: string[]
}
