import type { BackupPayload, LinkItem } from '../types'
import { normalizeUrl } from '../lib/capture'

const API = '/api/backup'
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingPush: BackupPayload | null = null

export async function fetchFileBackup(): Promise<BackupPayload> {
  const res = await fetch(API)
  if (!res.ok) throw new Error('Backup fetch failed')
  return (await res.json()) as BackupPayload
}

async function sendFileBackup(payload: BackupPayload): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload, null, 2),
  })
  if (!res.ok) throw new Error('Backup write failed')
  const data = (await res.json()) as { savedAt: string }
  return data.savedAt
}

export function scheduleFileBackup(links: LinkItem[], recentProjects: string[]): Promise<string> {
  pendingPush = {
    version: 1,
    savedAt: new Date().toISOString(),
    links,
    recentProjects,
  }

  return new Promise((resolve, reject) => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(async () => {
      const payload = pendingPush
      if (!payload) return
      pendingPush = null
      try {
        const savedAt = await sendFileBackup(payload)
        resolve(savedAt)
      } catch (error) {
        reject(error)
      }
    }, 400)
  })
}

export function mergeLinks(local: LinkItem[], remote: LinkItem[]): LinkItem[] {
  const map = new Map<string, LinkItem>()

  for (const link of [...remote, ...local]) {
    const key = normalizeUrl(link.url)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, link)
      continue
    }

    const newer =
      new Date(link.capturedAt).getTime() >= new Date(existing.capturedAt).getTime()
        ? link
        : existing
    const older = newer === link ? existing : link

    map.set(key, {
      ...older,
      ...newer,
      title: newer.title || older.title,
      whySaved: newer.whySaved || older.whySaved,
      description: newer.description || older.description,
      ogTitle: newer.ogTitle || older.ogTitle,
      ogDescription: newer.ogDescription || older.ogDescription,
      selectedText: newer.selectedText || older.selectedText,
      headings:
        (newer.headings?.length ?? 0) > 0 ? newer.headings : older.headings,
      tags: newer.tags.length > 0 ? newer.tags : older.tags,
      project: newer.project !== 'Unsorted' ? newer.project : older.project,
    })
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  )
}

export function mergeRecentProjects(local: string[], remote: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const project of [...local, ...remote]) {
    const key = project.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(project)
  }

  return merged.slice(0, 12)
}
