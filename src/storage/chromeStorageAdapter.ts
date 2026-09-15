import { CHROME_STORAGE_KEY } from '../constants.ts'
import { sortLinksByCapturedAt } from '../lib/capture.ts'
import { parseBackupPayloadLenient } from '../lib/validation.ts'
import { mutateChromePayload, readChromePayload, snapshotFromPayload } from './payload.ts'
import type { StorageAdapter } from './types.ts'

export const chromeStorageAdapter: StorageAdapter = {
  mode: 'extension',

  async readSnapshot() {
    const payload = await readChromePayload()
    return snapshotFromPayload(payload)
  },

  async mutateSnapshot(mutator) {
    const payload = await mutateChromePayload(async (current) => {
      const snapshot = snapshotFromPayload(current)
      const next = await mutator(snapshot)
      return {
        version: 1,
        savedAt: current.savedAt,
        links: sortLinksByCapturedAt(next.links),
        recentProjects: next.recentProjects,
      }
    })

    return {
      ...snapshotFromPayload(payload),
      backupState: 'active',
    }
  },

  async initialSync() {
    const payload = await readChromePayload()
    return {
      ...snapshotFromPayload(payload),
      backupState: 'active',
    }
  },

  subscribe(listener) {
    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      const change = changes[CHROME_STORAGE_KEY]
      if (!change?.newValue) return
      listener(snapshotFromPayload(parseBackupPayloadLenient(change.newValue)))
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  },
}
