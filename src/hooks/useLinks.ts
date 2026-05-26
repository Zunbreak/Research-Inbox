import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  captureLinksFromText,
  linkMatchesSearch,
  normalizeUrl,
  sortLinksByCapturedAt,
} from '../lib/capture'
import {
  fetchFileBackup,
  mergeLinks,
  mergeRecentProjects,
  scheduleFileBackup,
} from '../storage/backup'
import {
  exportLinksJson,
  importLinksJson,
  loadLinks,
  loadRecentProjects,
  saveLinks,
  saveRecentProjects,
} from '../storage/links'
import type { BackupState, CaptureResult, FilterState, LinkItem, LinkStatus } from '../types'
import { getProjectOptions, normalizeProject, sanitizeRecentProjects, trackRecentProject } from '../utils/project'
import { parseTags } from '../utils/url'

export function useLinks() {
  const [links, setLinks] = useState<LinkItem[]>(() => loadLinks())
  const [recentProjects, setRecentProjects] = useState<string[]>(() => loadRecentProjects())
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
  const recentProjectsRef = useRef(recentProjects)

  useEffect(() => {
    recentProjectsRef.current = recentProjects
  }, [recentProjects])

  const projectOptions = useMemo(
    () => getProjectOptions(
      recentProjects,
      links.map((link) => link.project),
    ),
    [recentProjects, links],
  )

  const pushBackup = useCallback((nextLinks: LinkItem[], nextRecent: string[]) => {
    setBackupState('saving')
    scheduleFileBackup(nextLinks, nextRecent)
      .then((savedAt) => {
        setLastBackupAt(savedAt)
        setBackupState('active')
      })
      .catch(() => {
        setBackupState('offline')
      })
  }, [])

  const persistLinks = useCallback(
    (next: LinkItem[], nextRecent = recentProjectsRef.current) => {
      const sorted = sortLinksByCapturedAt(next)
      setLinks(sorted)
      saveLinks(sorted)
      pushBackup(sorted, nextRecent)
    },
    [pushBackup],
  )

  const mergeFromFileBackup = useCallback(async () => {
    const file = await fetchFileBackup()
    const localLinks = loadLinks()
    const localRecent = loadRecentProjects()
    const mergedLinks = mergeLinks(localLinks, file.links)
    const mergedRecent = sanitizeRecentProjects(
      mergeRecentProjects(localRecent, file.recentProjects),
      mergedLinks,
    )

    return { mergedLinks, mergedRecent, localLinks, localRecent, savedAt: file.savedAt }
  }, [])

  const applyFileBackup = useCallback(
    (result: {
      mergedLinks: LinkItem[]
      mergedRecent: string[]
      localLinks: LinkItem[]
      localRecent: string[]
      savedAt: string | null
    }) => {
      const { mergedLinks, mergedRecent, localLinks, localRecent, savedAt } = result
      setLinks(mergedLinks)
      saveLinks(mergedLinks)
      setRecentProjects(mergedRecent)
      saveRecentProjects(mergedRecent)
      setLastBackupAt(savedAt)
      setBackupState('active')

      const changed =
        mergedLinks.length !== localLinks.length ||
        mergedRecent.length !== localRecent.length
      if (changed || mergedLinks.length > 0) {
        pushBackup(mergedLinks, mergedRecent)
      }
    },
    [pushBackup],
  )

  const syncFromFile = useCallback(async () => {
    try {
      const result = await mergeFromFileBackup()
      applyFileBackup(result)
      return result
    } catch {
      setBackupState('offline')
      return null
    }
  }, [applyFileBackup, mergeFromFileBackup])

  useEffect(() => {
    let cancelled = false

    void mergeFromFileBackup()
      .then((result) => {
        if (cancelled) return
        applyFileBackup(result)
      })
      .catch(() => {
        if (!cancelled) setBackupState('offline')
      })

    return () => {
      cancelled = true
    }
  }, [applyFileBackup, mergeFromFileBackup])

  useEffect(() => {
    const onFocus = () => {
      void syncFromFile()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [syncFromFile])

  const captureFromText = useCallback(
    (text: string, defaultProject?: string, defaultTagsRaw?: string): CaptureResult => {
      const lines = text.split(/\r?\n/)
      const defaultTags = defaultTagsRaw?.trim() ? parseTags(defaultTagsRaw) : undefined
      const { links: nextLinks, added, duplicates, invalid } = captureLinksFromText(links, lines, {
        defaultProject: defaultProject?.trim() ? normalizeProject(defaultProject) : undefined,
        defaultTags,
        source: 'paste',
      })

      persistLinks(nextLinks)
      const result = { added, duplicates, invalid }
      setLastCapture(result)
      return result
    },
    [links, persistLinks],
  )

  const updateLink = useCallback(
    (id: string, patch: Partial<LinkItem>) => {
      const next = links.map((link) => {
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

      let nextRecent = recentProjects
      const updatedLink = next.find((link) => link.id === id)
      if (updatedLink && patch.project !== undefined) {
        nextRecent = trackRecentProject(recentProjects, updatedLink.project)
        setRecentProjects(nextRecent)
        saveRecentProjects(nextRecent)
      }

      persistLinks(next, nextRecent)
    },
    [links, persistLinks, recentProjects],
  )

  const deleteLink = useCallback(
    (id: string) => {
      persistLinks(links.filter((link) => link.id !== id))
    },
    [links, persistLinks],
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

  const exportJson = useCallback(() => exportLinksJson(links), [links])

  const importJson = useCallback(
    (raw: string, mode: 'merge' | 'replace') => {
      const { links: importedLinks, skipped } = importLinksJson(raw)
      const imported = importedLinks.map((link) => ({
        ...link,
        source: link.source ?? ('import' as const),
      }))

      if (mode === 'replace') {
        persistLinks(imported)
        return { added: imported.length, skipped }
      }

      const existing = new Set(links.map((link) => normalizeUrl(link.url)))
      const merged = [...links]
      let added = 0

      for (const link of imported) {
        const key = normalizeUrl(link.url)
        if (existing.has(key)) continue
        merged.push(link)
        existing.add(key)
        added += 1
      }

      persistLinks(merged)
      return { added, skipped }
    },
    [links, persistLinks],
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
    captureFromText,
    updateLink,
    deleteLink,
    exportJson,
    importJson,
    parseTags,
  }
}
