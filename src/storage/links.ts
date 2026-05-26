import { RECENT_PROJECTS_KEY, STORAGE_KEY } from '../constants'
import { parseImportedLinks, parseStoredLinks } from '../lib/validation'
import type { LinkItem } from '../types'

export function loadLinks(): LinkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return parseStoredLinks(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveLinks(links: LinkItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

export function loadRecentProjects(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecentProjects(projects: string[]): void {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects))
}

export function exportLinksJson(links: LinkItem[]): string {
  return JSON.stringify(links, null, 2)
}

export interface ImportLinksResult {
  links: LinkItem[]
  skipped: number
}

export function importLinksJson(raw: string): ImportLinksResult {
  const result = parseImportedLinks(raw)
  if (!result.ok) {
    throw new Error(result.error)
  }
  return { links: result.links, skipped: result.skipped }
}
