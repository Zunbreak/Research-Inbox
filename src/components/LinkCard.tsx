import { useState } from 'react'
import { STATUSES } from '../constants'
import type { LinkItem } from '../types'
import { formatCapturedAt } from '../utils/date'
import { formatTags, parseTags } from '../utils/url'

interface LinkCardProps {
  link: LinkItem
  projectOptions: string[]
  onUpdate: (id: string, patch: Partial<LinkItem>) => void
  onDelete: (id: string) => void
  onFilter?: (patch: {
    status?: LinkItem['status']
    project?: string
    tag?: string
    domain?: string
  }) => void
}

function getFallbackSnippet(link: LinkItem): string | null {
  return link.whySaved?.trim() || link.description?.trim() || link.ogDescription?.trim() || null
}

function truncate(text: string, max = 220): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function statusLabel(status: LinkItem['status']): string {
  return STATUSES.find((item) => item.value === status)?.label ?? status
}

export function LinkCard({ link, projectOptions, onUpdate, onDelete, onFilter }: LinkCardProps) {
  const [editing, setEditing] = useState(false)
  const [projectDraft, setProjectDraft] = useState(link.project)
  const [tagsDraft, setTagsDraft] = useState(formatTags(link.tags))

  const captured = formatCapturedAt(link.capturedAt)

  const displayTitle = link.title || link.ogTitle || link.url
  const selectedText = link.selectedText?.trim() || null
  const noteSnippet = getFallbackSnippet(link)
  const showNote =
    noteSnippet &&
    (!selectedText || noteSnippet.toLowerCase() !== selectedText.toLowerCase())

  const editProjectOptions =
    link.project && !projectOptions.includes(link.project)
      ? [link.project, ...projectOptions]
      : projectOptions

  const commitTags = () => {
    const parsed = parseTags(tagsDraft)
    const unchanged =
      parsed.length === link.tags.length && parsed.every((tag, index) => tag === link.tags[index])
    if (!unchanged) {
      onUpdate(link.id, { tags: parsed })
    }
  }

  const finishEditing = () => {
    commitTags()
    setEditing(false)
  }

  const inputClass =
    'w-full rounded-md border border-border/80 bg-surface-elevated/80 px-2.5 py-1.5 text-xs text-foreground-secondary placeholder:text-faint focus:border-accent/50 focus:outline-none'
  const labelClass = 'mb-1 block text-[10px] font-medium uppercase tracking-wide text-faint'

  const chipClass =
    'rounded-full px-2 py-0.5 text-[11px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50'
  const chipButtonClass = `${chipClass} cursor-pointer hover:ring-1 hover:ring-faint/60`

  const cardTone =
    link.status === 'archive'
      ? 'border-border/40 bg-surface/10 opacity-80'
      : link.status === 'trash'
        ? 'border-danger-surface-border bg-danger-surface-bg opacity-75'
        : 'border-border/60 bg-surface/20'

  if (!editing) {
    return (
      <article
        className={`group rounded-lg border px-4 py-3.5 transition-colors hover:border-border-strong/80 hover:bg-surface/35 ${cardTone}`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mb-2 block text-base font-medium leading-snug hover:text-accent-foreground-soft ${
                link.status === 'trash'
                  ? 'text-subtle line-through decoration-faint'
                  : 'text-foreground'
              }`}
            >
              {displayTitle}
            </a>

            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {onFilter ? (
                <button
                  type="button"
                  onClick={() => onFilter({ domain: link.domain })}
                  className={`${chipButtonClass} bg-border/80 text-muted hover:bg-border hover:text-foreground-secondary`}
                  title={`Filter by ${link.domain}`}
                >
                  {link.domain}
                </button>
              ) : (
                <span className={`${chipClass} bg-border/80 text-muted`}>{link.domain}</span>
              )}
              {link.project !== 'Unsorted' &&
                (onFilter ? (
                  <button
                    type="button"
                    onClick={() => onFilter({ project: link.project })}
                    className={`${chipButtonClass} bg-project-chip-bg text-project-chip-text hover:bg-project-chip-hover`}
                    title={`Filter by ${link.project}`}
                  >
                    {link.project}
                  </button>
                ) : (
                  <span className={`${chipClass} bg-project-chip-bg text-project-chip-text`}>
                    {link.project}
                  </span>
                ))}
              {link.tags.map((tag) =>
                onFilter ? (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onFilter({ tag })}
                    className={`${chipButtonClass} bg-border/50 text-subtle hover:bg-border hover:text-foreground-tertiary`}
                    title={`Filter by ${tag}`}
                  >
                    {tag}
                  </button>
                ) : (
                  <span key={tag} className={`${chipClass} bg-border/50 text-subtle`}>
                    {tag}
                  </span>
                ),
              )}
              {onFilter ? (
                <button
                  type="button"
                  onClick={() => onFilter({ status: link.status })}
                  className={`${chipButtonClass} bg-border/40 text-faint hover:bg-border hover:text-muted`}
                  title={`Filter by ${statusLabel(link.status)}`}
                >
                  {statusLabel(link.status)}
                </button>
              ) : (
                <span className={`${chipClass} bg-border/40 text-faint`}>
                  {statusLabel(link.status)}
                </span>
              )}
            </div>

            {selectedText && (
              <div className="mb-2 rounded-md border-l-2 border-selected-text-border bg-selected-text-bg px-3 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-selected-text-label">
                  Selected text
                </p>
                <p className="line-clamp-3 text-sm italic leading-relaxed text-muted">
                  “{truncate(selectedText)}”
                </p>
              </div>
            )}

            {showNote && (
              <p className="line-clamp-2 text-sm leading-relaxed text-subtle">{noteSnippet}</p>
            )}

            <p className="mt-2 text-[10px] text-faint/70">{captured}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setProjectDraft(link.project)
                setTagsDraft(formatTags(link.tags))
                setEditing(true)
              }}
              className="rounded-md px-2.5 py-1 text-[11px] text-muted hover:bg-border hover:text-foreground-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(link.id)}
              className="rounded-md px-2.5 py-1 text-[11px] text-faint hover:bg-danger-soft/50 hover:text-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-accent/20 bg-surface/50 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-accent-foreground/80">
          Editing
        </span>
        <button
          type="button"
          onClick={finishEditing}
          className="rounded-md px-2 py-1 text-[11px] text-muted hover:bg-border hover:text-foreground-secondary"
        >
          Done
        </button>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block truncate text-xs text-faint hover:text-accent-foreground"
      >
        {link.url}
      </a>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Title</span>
          <input
            type="text"
            value={link.title}
            onChange={(e) => onUpdate(link.id, { title: e.target.value })}
            placeholder="Optional title"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Status</span>
          <select
            value={link.status}
            onChange={(e) => onUpdate(link.id, { status: e.target.value as LinkItem['status'] })}
            className={inputClass}
          >
            {STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Project</span>
          <p className="mb-1.5 text-[10px] text-faint">
            Choose existing · or enter a new name below
          </p>
          <select
            value={link.project}
            onChange={(e) => {
              setProjectDraft(e.target.value)
              onUpdate(link.id, { project: e.target.value })
            }}
            className={inputClass}
          >
            {editProjectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={projectDraft}
            onChange={(e) => setProjectDraft(e.target.value)}
            onBlur={() => {
              if (projectDraft.trim() && projectDraft !== link.project) {
                onUpdate(link.id, { project: projectDraft })
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            placeholder="New project name…"
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Tags</span>
          <input
            type="text"
            value={tagsDraft}
            onChange={(e) => setTagsDraft(e.target.value)}
            onBlur={commitTags}
            placeholder="mcp, agents, docs"
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Why saved</span>
          <textarea
            value={link.whySaved}
            onChange={(e) => onUpdate(link.id, { whySaved: e.target.value })}
            placeholder="Why this matters — this is what you'll search for later"
            rows={2}
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Selected text</span>
          <textarea
            value={link.selectedText ?? ''}
            onChange={(e) => onUpdate(link.id, { selectedText: e.target.value })}
            placeholder="Highlighted text from the page — searchable later"
            rows={3}
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea
            value={link.description ?? ''}
            onChange={(e) => onUpdate(link.id, { description: e.target.value })}
            placeholder="Page summary or meta description"
            rows={2}
            className={inputClass}
          />
        </label>
      </div>
    </article>
  )
}
