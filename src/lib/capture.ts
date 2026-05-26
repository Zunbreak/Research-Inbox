import { DEFAULT_PROJECT } from '../constants'
import type { CaptureLinkInput, CaptureLinkResult, LinkItem, LinkSource } from '../types'
import { normalizeProject } from '../utils/project'
import { getCapturedAtSearchText } from '../utils/date'
import { normalizeUrl, parseDomain } from '../utils/url'

export { normalizeUrl, parseDomain }

export function createLink(input: CaptureLinkInput): LinkItem {
  const url = input.url.trim()
  const title = input.title?.trim() || input.ogTitle?.trim() || ''

  return {
    id: crypto.randomUUID(),
    url,
    title,
    domain: parseDomain(url),
    capturedAt: new Date().toISOString(),
    status: 'inbox',
    project: input.project ? normalizeProject(input.project) : DEFAULT_PROJECT,
    tags: input.tags?.map((tag) => tag.trim().toLowerCase()).filter(Boolean) ?? [],
    whySaved: input.whySaved?.trim() ?? '',
    description: input.description?.trim() || undefined,
    ogTitle: input.ogTitle?.trim() || undefined,
    ogDescription: input.ogDescription?.trim() || undefined,
    headings: input.headings?.map((h) => h.trim()).filter(Boolean),
    selectedText: input.selectedText?.trim() || undefined,
    source: input.source ?? 'manual',
    capturedFrom: input.capturedFrom?.trim() || undefined,
  }
}

export function findDuplicateLink(links: LinkItem[], url: string): LinkItem | undefined {
  const key = normalizeUrl(url)
  return links.find((link) => normalizeUrl(link.url) === key)
}

export function addCapturedLink(
  links: LinkItem[],
  input: CaptureLinkInput,
): { links: LinkItem[]; result: CaptureLinkResult } {
  if (!input.url?.trim()) {
    return {
      links,
      result: {
        success: false,
        status: 'invalid',
        message: 'URL is required',
      },
    }
  }

  const duplicate = findDuplicateLink(links, input.url)
  if (duplicate) {
    return {
      links,
      result: {
        success: true,
        status: 'duplicate',
        id: duplicate.id,
        message: 'Link already exists in inbox',
      },
    }
  }

  const link = createLink(input)
  return {
    links: [link, ...links],
    result: {
      success: true,
      status: 'created',
      id: link.id,
      message: 'Link captured',
    },
  }
}

export function captureLinksFromText(
  links: LinkItem[],
  lines: string[],
  options?: { defaultProject?: string; defaultTags?: string[]; source?: LinkSource },
): { links: LinkItem[]; added: number; duplicates: number; invalid: number } {
  const existing = new Set(links.map((link) => normalizeUrl(link.url)))
  const nextLinks = [...links]
  let added = 0
  let duplicates = 0
  let invalid = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(/^https?:\/\/[^\s]+/i)
    if (!match) {
      invalid += 1
      continue
    }

    const url = match[0].replace(/[),.;]+$/, '')
    const key = normalizeUrl(url)
    if (existing.has(key)) {
      duplicates += 1
      continue
    }

    const link = createLink({
      url,
      source: options?.source ?? 'paste',
      project: options?.defaultProject,
      tags: options?.defaultTags,
    })
    nextLinks.push(link)
    existing.add(key)
    added += 1
  }

  return { links: nextLinks, added, duplicates, invalid }
}

export function searchIndexText(link: LinkItem): string {
  return [
    link.url,
    link.title,
    link.domain,
    link.project,
    link.whySaved,
    link.description,
    link.ogTitle,
    link.ogDescription,
    link.selectedText,
    link.capturedFrom,
    link.source,
    getCapturedAtSearchText(link.capturedAt),
    ...(link.headings ?? []),
    ...link.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function linkMatchesSearch(link: LinkItem, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return searchIndexText(link).includes(normalized)
}

export function sortLinksByCapturedAt(links: LinkItem[]): LinkItem[] {
  return [...links].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  )
}
