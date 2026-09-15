import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  captureLinksFromText,
  linkMatchesSearch,
  sortLinksByCapturedAt,
} from '../lib/capture.ts'
import { countImportMergeStats, mergeLinks, mergeRecentProjects } from '../storage/backup.ts'
import { getStorageAdapter } from '../storage/getAdapter.ts'
import { readLastExportedAt, writeLastExportedAt } from '../storage/lastExported.ts'
import { exportLinksJson, importLinksJson } from '../storage/links.ts'
import type { InboxSnapshot } from '../storage/types.ts'
import type {
  BackupState,
  CaptureResult,
  FilterState,
  ImportBackupResult,
  LinkItem,
  LinkStatus,
} from '../types.ts'
import { getProjectOptions, normalizeProject, sanitizeRecentProjects, trackRecentProject } from '../utils/project.ts'
import { parseTags } from '../utils/url.ts'

export function useLinks() {
  const adapter = useMemo(() => getStorageAdapter(), [])
  const [links, setLinks] = useState<LinkItem[]>([])
  const [recentProjects, setRecentProjects] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    project: '',
    tag: '',
    domain: '',
  })
  const [lastCapture, setLastCapture] = useState<CaptureResult | null>(null)
  const [backupState, setBackupState] = useState<BackupState>('loading')
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null)

  const applySnapshot = useCallback((snapshot: InboxSnapshot, state: BackupState) => {
    setLinks(sortLinksByCapturedAt(snapshot.links))
    setRecentProjects(snapshot.recentProjects)
    setLastBackupAt(snapshot.savedAt)
    setBackupState(state)
  }, [])

  const mutateSnapshot = useCallback(
    async (
      mutator: (current: InboxSnapshot) => InboxSnapshot | Promise<InboxSnapshot>,
    ) => {
      setBackupState('saving')
      const result = await adapter.mutateSnapshot(mutator)
      applySnapshot(result, result.backupState)
      return result
    },
    [adapter, applySnapshot],
  )

  useEffect(() => {
    let cancelled = false

    void adapter.initialSync().then((result) => {
      if (cancelled) return
      applySnapshot(result, result.backupState)
    })

    return () => {
      cancelled = true
    }
  }, [adapter, applySnapshot])

  useEffect(() => {
    return adapter.subscribe((snapshot) => {
      applySnapshot(snapshot, 'active')
    })
  }, [adapter, applySnapshot])

  useEffect(() => {
    let cancelled = false

    void readLastExportedAt().then((savedAt) => {
      if (!cancelled) setLastExportedAt(savedAt)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const projectOptions = useMemo(
    () =>
      getProjectOptions(
        recentProjects,
        links.map((link) => link.project),
      ),
    [recentProjects, links],
  )

  const captureFromText = useCallback(
    async (
      text: string,
      defaultProject?: string,
      defaultTagsRaw?: string,
    ): Promise<CaptureResult> => {
      const lines = text.split(/\r?\n/)
      const defaultTags = defaultTagsRaw?.trim() ? parseTags(defaultTagsRaw) : undefined
      let result: CaptureResult = { added: 0, duplicates: 0, invalid: 0 }

      await mutateSnapshot((current) => {
        const captured = captureLinksFromText(current.links, lines, {
          defaultProject: defaultProject?.trim() ? normalizeProject(defaultProject) : undefined,
          defaultTags,
          source: 'paste',
        })
        result = {
          added: captured.added,
          duplicates: captured.duplicates,
          invalid: captured.invalid,
        }
        return {
          ...current,
          links: captured.links,
        }
      })

      setLastCapture(result)
      return result
    },
    [mutateSnapshot],
  )

  const updateLink = useCallback(
    (id: string, patch: Partial<LinkItem>) => {
      void mutateSnapshot((current) => {
        const nextLinks = current.links.map((link) => {
          if (link.id !== id) return link
          const updated = { ...link, ...patch }
          if (patch.project !== undefined) {
            updated.project = normalizeProject(patch.project)
          }
          if (patch.tags !== undefined) {
            updated.tags = patch.tags
          }
          return updated
        })

        let nextRecent = current.recentProjects
        const updatedLink = nextLinks.find((link) => link.id === id)
        if (updatedLink && patch.project !== undefined) {
          nextRecent = trackRecentProject(current.recentProjects, updatedLink.project)
        }

        return {
          links: nextLinks,
          recentProjects: nextRecent,
          savedAt: current.savedAt,
        }
      })
    },
    [mutateSnapshot],
  )

  const deleteLink = useCallback(
    (id: string) => {
      void mutateSnapshot((current) => ({
        ...current,
        links: current.links.filter((link) => link.id !== id),
      }))
    },
    [mutateSnapshot],
  )

  const filteredLinks = useMemo(() => {
    const query = filters.search.trim()

    return links.filter((link) => {
      if (filters.status !== 'all' && link.status !== filters.status) return false
      if (filters.project && link.project !== filters.project) return false
      if (filters.tag && !link.tags.includes(filters.tag.toLowerCase())) return false
      if (filters.domain && link.domain !== filters.domain) return false
      return linkMatchesSearch(link, query)
    })
  }, [filters, links])

  const facetCounts = useMemo(() => {
    const status: Record<LinkStatus, number> = { inbox: 0, archive: 0, trash: 0 }
    const projects = new Map<string, number>()
    const tags = new Map<string, number>()
    const domains = new Map<string, number>()

    for (const link of links) {
      status[link.status] += 1
      projects.set(link.project, (projects.get(link.project) ?? 0) + 1)
      for (const tag of link.tags) {
        tags.set(tag, (tags.get(tag) ?? 0) + 1)
      }
      domains.set(link.domain, (domains.get(link.domain) ?? 0) + 1)
    }

    return {
      status,
      projects: [...projects.entries()].sort((a, b) => b[1] - a[1]),
      tags: [...tags.entries()].sort((a, b) => b[1] - a[1]),
      domains: [...domains.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [links])

  const exportBackup = useCallback(async () => {
    const json = exportLinksJson(links)
    const savedAt = new Date().toISOString()
    await writeLastExportedAt(savedAt)
    setLastExportedAt(savedAt)
    return json
  }, [links])

  const importJson = useCallback(
    async (raw: string, mode: 'merge' | 'replace'): Promise<ImportBackupResult> => {
      const { links: importedLinks, recentProjects: importedRecent } = importLinksJson(raw)
      const imported = importedLinks.map((link) => ({
        ...link,
        source: link.source ?? ('import' as const),
      }))

      if (mode === 'replace') {
        await mutateSnapshot((current) => ({
          links: sortLinksByCapturedAt(imported),
          recentProjects: sanitizeRecentProjects(
            importedRecent ?? current.recentProjects,
            imported,
          ),
          savedAt: current.savedAt,
        }))
        return { mode: 'replace', total: imported.length }
      }

      let stats = { added: 0, alreadyExisted: 0 }

      await mutateSnapshot((current) => {
        stats = countImportMergeStats(current.links, imported)
        const mergedLinks = mergeLinks(current.links, imported)
        const mergedRecent = sanitizeRecentProjects(
          mergeRecentProjects(current.recentProjects, importedRecent ?? []),
          mergedLinks,
        )

        return {
          links: mergedLinks,
          recentProjects: mergedRecent,
          savedAt: current.savedAt,
        }
      })

      return { mode: 'merge', ...stats }
    },
    [mutateSnapshot],
  )

  return {
    links,
    filteredLinks,
    filters,
    setFilters,
    projectOptions,
    facetCounts,
    lastCapture,
    backupState,
    lastBackupAt,
    lastExportedAt,
    storageMode: adapter.mode,
    captureFromText,
    updateLink,
    deleteLink,
    exportBackup,
    importJson,
    parseTags,
  }
}
