import { sortLinksByCapturedAt } from '../lib/capture.ts'
import {
  fetchFileBackup,
  mergeLinks,
  mergeRecentProjects,
  scheduleFileBackup,
} from './backup.ts'
import { loadLinks, loadRecentProjects, saveLinks, saveRecentProjects } from './links.ts'
import { sanitizeRecentProjects } from '../utils/project.ts'
import type { InboxSnapshot, StorageAdapter } from './types.ts'

function readLocalSnapshot(): InboxSnapshot {
  return {
    links: loadLinks(),
    recentProjects: loadRecentProjects(),
    savedAt: null,
  }
}

async function mergeFromFile(): Promise<{
  snapshot: InboxSnapshot
  changed: boolean
}> {
  const file = await fetchFileBackup()
  const local = readLocalSnapshot()
  const mergedLinks = sortLinksByCapturedAt(mergeLinks(local.links, file.links))
  const mergedRecent = sanitizeRecentProjects(
    mergeRecentProjects(local.recentProjects, file.recentProjects),
    mergedLinks,
  )

  const changed =
    mergedLinks.length !== local.links.length ||
    mergedRecent.length !== local.recentProjects.length ||
    mergedLinks.some((link, index) => link.id !== local.links[index]?.id)

  return {
    snapshot: {
      links: mergedLinks,
      recentProjects: mergedRecent,
      savedAt: file.savedAt,
    },
    changed,
  }
}

export const devStorageAdapter: StorageAdapter = {
  mode: 'dev',

  async readSnapshot() {
    return readLocalSnapshot()
  },

  async mutateSnapshot(mutator) {
    const current = readLocalSnapshot()
    const next = await mutator(current)
    const sortedLinks = sortLinksByCapturedAt(next.links)

    saveLinks(sortedLinks)
    saveRecentProjects(next.recentProjects)

    try {
      const savedAt = await scheduleFileBackup(sortedLinks, next.recentProjects)
      return {
        links: sortedLinks,
        recentProjects: next.recentProjects,
        savedAt,
        backupState: 'active',
      }
    } catch {
      return {
        links: sortedLinks,
        recentProjects: next.recentProjects,
        savedAt: next.savedAt,
        backupState: 'offline',
      }
    }
  },

  async initialSync() {
    try {
      const { snapshot, changed } = await mergeFromFile()
      saveLinks(snapshot.links)
      saveRecentProjects(snapshot.recentProjects)

      if (changed || snapshot.links.length > 0) {
        try {
          const savedAt = await scheduleFileBackup(snapshot.links, snapshot.recentProjects)
          return { ...snapshot, savedAt, backupState: 'active' }
        } catch {
          return { ...snapshot, backupState: 'offline' }
        }
      }

      return { ...snapshot, backupState: 'active' }
    } catch {
      const local = readLocalSnapshot()
      return { ...local, backupState: 'offline' }
    }
  },

  subscribe(listener) {
    const onFocus = () => {
      void mergeFromFile()
        .then(({ snapshot, changed }) => {
          if (!changed) return
          saveLinks(snapshot.links)
          saveRecentProjects(snapshot.recentProjects)
          listener(snapshot)
        })
        .catch(() => {
          // keep current UI state when backup API is offline
        })
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  },
}
