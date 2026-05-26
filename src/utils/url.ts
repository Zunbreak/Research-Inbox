export function extractUrlFromLine(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^https?:\/\/[^\s]+/i)
  if (!match) return null

  return match[0].replace(/[),.;]+$/, '')
}

export function parseDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim())
    const hash = parsed.hash.toLowerCase()
    parsed.hash = ''
    let base = parsed.toString()
    if (base.endsWith('/')) {
      base = base.slice(0, -1)
    }
    return (base + hash).toLowerCase()
  } catch {
    return url.trim().toLowerCase()
  }
}

export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
}

export function formatTags(tags: string[]): string {
  return tags.join(', ')
}
