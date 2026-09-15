import { RECENT_PROJECTS_KEY, STORAGE_KEY } from '../constants.ts'
import { parseImportPayloadStrict, parseStoredLinks } from '../lib/validation.ts'
import type { LinkItem } from '../types.ts'

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
  recentProjects?: string[]
}

export function importLinksJson(raw: string): ImportLinksResult {
  const result = parseImportPayloadStrict(raw)
  if (!result.ok) {
    throw new Error(result.error)
  }
  return {
    links: result.value.links,
    recentProjects: result.value.recentProjects,
  }
}
