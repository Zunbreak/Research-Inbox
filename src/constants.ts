import type { LinkStatus } from './types'

export const STORAGE_KEY = 'zunbreak-research-inbox'
export const RECENT_PROJECTS_KEY = 'zunbreak-recent-projects'

export const DEFAULT_PROJECTS: readonly string[] = []

export const DEFAULT_PROJECT = 'Unsorted'

export const STATUSES: { value: LinkStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'archive', label: 'Archive' },
  { value: 'trash', label: 'Trash' },
]
