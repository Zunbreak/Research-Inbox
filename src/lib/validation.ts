import { z } from 'zod'
import type { BackupPayload, CaptureLinkInput, LinkItem } from '../types'

export const LIMITS = {
  url: 4096,
  text: 8000,
  selectedText: 20_000,
  project: 200,
  tag: 100,
  tagCount: 50,
  heading: 500,
  headingCount: 50,
  id: 128,
  domain: 253,
  capturedFrom: 500,
  recentProjects: 24,
  captureBodyBytes: 512 * 1024,
  backupBodyBytes: 10 * 1024 * 1024,
} as const

const linkStatusSchema = z.enum(['inbox', 'archive', 'trash'])
const linkSourceSchema = z.enum(['paste', 'import', 'extension', 'manual'])

const optionalText = (max: number) => z.string().max(max).optional()

export const captureLinkInputSchema = z
  .object({
    url: z.string().min(1).max(LIMITS.url),
    title: optionalText(LIMITS.text),
    description: optionalText(LIMITS.text),
    ogTitle: optionalText(LIMITS.text),
    ogDescription: optionalText(LIMITS.text),
    headings: z.array(z.string().max(LIMITS.heading)).max(LIMITS.headingCount).optional(),
    selectedText: optionalText(LIMITS.selectedText),
    source: linkSourceSchema.optional(),
    capturedFrom: optionalText(LIMITS.capturedFrom),
    project: optionalText(LIMITS.project),
    tags: z.array(z.string().max(LIMITS.tag)).max(LIMITS.tagCount).optional(),
    whySaved: optionalText(LIMITS.text),
  })
  .strict()

export const linkItemSchema = z
  .object({
    id: z.string().min(1).max(LIMITS.id),
    url: z.string().min(1).max(LIMITS.url),
    title: z.string().max(LIMITS.text),
    domain: z.string().max(LIMITS.domain),
    capturedAt: z.string().min(1).max(64),
    status: linkStatusSchema,
    project: z.string().max(LIMITS.project),
    tags: z.array(z.string().max(LIMITS.tag)).max(LIMITS.tagCount),
    whySaved: z.string().max(LIMITS.text),
    description: optionalText(LIMITS.text),
    ogTitle: optionalText(LIMITS.text),
    ogDescription: optionalText(LIMITS.text),
    headings: z.array(z.string().max(LIMITS.heading)).max(LIMITS.headingCount).optional(),
    selectedText: optionalText(LIMITS.selectedText),
    source: linkSourceSchema.optional(),
    capturedFrom: optionalText(LIMITS.capturedFrom),
  })
  .strip()

export const backupPayloadSchema = z
  .object({
    version: z.literal(1),
    savedAt: z.string().max(64).nullable(),
    links: z.array(linkItemSchema),
    recentProjects: z.array(z.string().max(LIMITS.project)).max(LIMITS.recentProjects),
  })
  .strict()

const importArraySchema = z.array(z.unknown())

export class PayloadTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Payload exceeds ${maxBytes} bytes`)
    this.name = 'PayloadTooLargeError'
  }
}

export function parseCaptureLinkInput(data: unknown):
  | { ok: true; value: CaptureLinkInput }
  | { ok: false; error: string } {
  const result = captureLinkInputSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid capture payload' }
  }
  return { ok: true, value: result.data }
}

export function parseBackupPayload(data: unknown):
  | { ok: true; value: BackupPayload }
  | { ok: false; error: string } {
  const result = backupPayloadSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid backup payload' }
  }
  return { ok: true, value: result.data as BackupPayload }
}

/** Lenient read for local disk — keeps valid links even if file has minor issues. */
export function parseBackupPayloadLenient(data: unknown): BackupPayload {
  const empty: BackupPayload = { version: 1, savedAt: null, links: [], recentProjects: [] }
  if (!data || typeof data !== 'object') return empty

  const record = data as Record<string, unknown>
  if (record.version !== 1) return empty

  const links: LinkItem[] = []
  if (Array.isArray(record.links)) {
    for (const item of record.links) {
      const result = linkItemSchema.safeParse(item)
      if (result.success) links.push(result.data as LinkItem)
    }
  }

  const recentProjects = Array.isArray(record.recentProjects)
    ? record.recentProjects
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.slice(0, LIMITS.project))
        .slice(0, LIMITS.recentProjects)
    : []

  return {
    version: 1,
    savedAt: typeof record.savedAt === 'string' ? record.savedAt : null,
    links,
    recentProjects,
  }
}

export function parseImportedLinks(raw: string):
  | { ok: true; links: LinkItem[]; skipped: number }
  | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Invalid JSON' }
  }

  const arrayResult = importArraySchema.safeParse(parsed)
  if (!arrayResult.success) {
    return { ok: false, error: 'Expected an array of links' }
  }

  const links: LinkItem[] = []
  let skipped = 0

  for (const item of arrayResult.data) {
    const result = linkItemSchema.safeParse(item)
    if (result.success) {
      links.push(result.data as LinkItem)
    } else {
      skipped += 1
    }
  }

  if (links.length === 0 && skipped > 0) {
    return { ok: false, error: 'No valid links found in file' }
  }

  return { ok: true, links, skipped }
}

/** Lenient read for localStorage — keeps valid links, skips bad entries. */
export function parseStoredLinks(parsed: unknown): LinkItem[] {
  if (!Array.isArray(parsed)) return []

  const links: LinkItem[] = []
  let skipped = 0

  for (const item of parsed) {
    const result = linkItemSchema.safeParse(item)
    if (result.success) {
      links.push(result.data as LinkItem)
    } else {
      skipped += 1
    }
  }

  if (skipped > 0) {
    console.warn(
      `Skipped ${skipped} invalid localStorage link${skipped === 1 ? '' : 's'}`,
    )
  }

  return links
}
