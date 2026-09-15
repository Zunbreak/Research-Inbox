import { CHROME_STORAGE_KEY } from '../constants.ts'
import { parseBackupPayloadLenient } from '../lib/validation.ts'
import type { BackupPayload } from '../types.ts'
import type { InboxSnapshot } from './types.ts'

export function emptyPayload(): BackupPayload {
  return { version: 1, savedAt: null, links: [], recentProjects: [] }
}

export function snapshotFromPayload(payload: BackupPayload): InboxSnapshot {
  return {
    links: payload.links,
    recentProjects: payload.recentProjects,
    savedAt: payload.savedAt,
  }
}

export function toPayload(snapshot: InboxSnapshot, savedAt?: string): BackupPayload {
  return {
    version: 1,
    savedAt: savedAt ?? snapshot.savedAt ?? new Date().toISOString(),
    links: snapshot.links,
    recentProjects: snapshot.recentProjects,
  }
}

export async function readChromePayload(): Promise<BackupPayload> {
  const stored = await chrome.storage.local.get(CHROME_STORAGE_KEY)
  const raw = stored[CHROME_STORAGE_KEY]
  if (!raw) return emptyPayload()
  return parseBackupPayloadLenient(raw)
}

export async function writeChromePayload(payload: BackupPayload): Promise<string> {
  const savedAt = new Date().toISOString()
  const next: BackupPayload = { ...payload, savedAt }
  await chrome.storage.local.set({ [CHROME_STORAGE_KEY]: next })
  return savedAt
}

export async function mutateChromePayload(
  mutator: (current: BackupPayload) => BackupPayload | Promise<BackupPayload>,
): Promise<BackupPayload> {
  const current = await readChromePayload()
  const next = await mutator(current)
  const savedAt = new Date().toISOString()
  const payload: BackupPayload = { ...next, savedAt }
  await chrome.storage.local.set({ [CHROME_STORAGE_KEY]: payload })
  return payload
}
