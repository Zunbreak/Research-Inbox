import { DEFAULT_PROJECT, DEFAULT_PROJECTS } from '../constants.ts'

export function normalizeProject(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return DEFAULT_PROJECT

  const match = DEFAULT_PROJECTS.find(
    (project) => project.toLowerCase() === trimmed.toLowerCase(),
  )
  return match ?? trimmed
}

export function getProjectOptions(
  recentProjects: string[],
  usedProjects: string[] = [],
): string[] {
  const seen = new Set<string>()
  const options: string[] = []

  for (const project of [...DEFAULT_PROJECTS, ...recentProjects, ...usedProjects]) {
    const normalized = normalizeProject(project)
    const key = normalized.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      options.push(normalized)
    }
  }

  return options
}

export function trackRecentProject(
  recentProjects: string[],
  project: string,
): string[] {
  const normalized = normalizeProject(project)
  if (normalized === DEFAULT_PROJECT) return recentProjects

  const filtered = recentProjects.filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase(),
  )
  return [normalized, ...filtered].slice(0, 12)
}

export function sanitizeRecentProjects(
  recentProjects: string[],
  links: { project: string }[],
): string[] {
  const usedProjects = new Set(
    links
      .map((link) => normalizeProject(link.project))
      .filter((project) => project !== DEFAULT_PROJECT),
  )

  const allowed = new Set<string>(
    DEFAULT_PROJECTS.filter((project) => project !== DEFAULT_PROJECT).map((project) =>
      project.toLowerCase(),
    ),
  )

  for (const project of usedProjects) {
    allowed.add(project.toLowerCase())
  }

  const cleaned: string[] = []
  const seen = new Set<string>()

  for (const project of recentProjects) {
    const normalized = normalizeProject(project)
    const key = normalized.toLowerCase()
    if (seen.has(key) || !allowed.has(key)) continue
    seen.add(key)
    cleaned.push(normalized)
  }

  return cleaned.slice(0, 12)
}
