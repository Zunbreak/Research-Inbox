import type { LinkStatus } from './types.ts'

export const STORAGE_KEY = 'zunbreak-research-inbox'
export const RECENT_PROJECTS_KEY = 'zunbreak-recent-projects'
export const CHROME_STORAGE_KEY = 'zunbreak-research-inbox-v1'
export const LAST_EXPORTED_KEY = 'zunbreak-last-exported-at'
export const THEME_PREFERENCE_KEY = 'zunbreak-theme-preference'

export const DEFAULT_PROJECTS: readonly string[] = []

export const DEFAULT_PROJECT = 'Unsorted'

export const STATUSES: { value: LinkStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'archive', label: 'Archive' },
  { value: 'trash', label: 'Trash' },
]
