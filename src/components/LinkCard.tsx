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

  const inputClass =
    'w-full rounded-md border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none'
  const labelClass = 'mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-600'

  const chipClass =
    'rounded-full px-2 py-0.5 text-[10px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50'
  const chipButtonClass = `${chipClass} cursor-pointer hover:ring-1 hover:ring-zinc-600/60`

  if (!editing) {
    return (
      <article className="group rounded-lg border border-zinc-800/60 bg-zinc-900/20 px-4 py-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/35">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 block text-[15px] font-medium leading-snug text-zinc-100 hover:text-violet-200"
            >
              {displayTitle}
            </a>

            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {onFilter ? (
                <button
                  type="button"
                  onClick={() => onFilter({ domain: link.domain })}
                  className={`${chipButtonClass} bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200`}
                  title={`Filter by ${link.domain}`}
                >
                  {link.domain}
                </button>
              ) : (
                <span className={`${chipClass} bg-zinc-800/80 text-zinc-400`}>{link.domain}</span>
              )}
              {link.project !== 'Unsorted' &&
                (onFilter ? (
                  <button
                    type="button"
                    onClick={() => onFilter({ project: link.project })}
                    className={`${chipButtonClass} bg-violet-950/60 text-violet-300 hover:bg-violet-950/90`}
                    title={`Filter by ${link.project}`}
                  >
                    {link.project}
                  </button>
                ) : (
                  <span className={`${chipClass} bg-violet-950/60 text-violet-300`}>
                    {link.project}
                  </span>
                ))}
              {link.tags.map((tag) =>
                onFilter ? (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onFilter({ tag })}
                    className={`${chipButtonClass} bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300`}
                    title={`Filter by ${tag}`}
                  >
                    {tag}
                  </button>
                ) : (
                  <span
                    key={tag}
                    className={`${chipClass} bg-zinc-800/50 text-zinc-500`}
                  >
                    {tag}
                  </span>
                ),
              )}
              {onFilter ? (
                <button
                  type="button"
                  onClick={() => onFilter({ status: link.status })}
                  className={`${chipButtonClass} bg-zinc-800/40 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400`}
                  title={`Filter by ${statusLabel(link.status)}`}
                >
                  {statusLabel(link.status)}
                </button>
              ) : (
                <span className={`${chipClass} bg-zinc-800/40 text-zinc-600`}>
                  {statusLabel(link.status)}
                </span>
              )}
            </div>

            {selectedText && (
              <div className="mb-2 rounded-md border-l-2 border-violet-500/40 bg-violet-950/20 px-3 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-violet-400/70">
                  Selected text
                </p>
                <p className="line-clamp-3 text-xs italic leading-relaxed text-zinc-400">
                  “{truncate(selectedText)}”
                </p>
              </div>
            )}

            {showNote && (
              <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{noteSnippet}</p>
            )}

            <p className="mt-2 text-[10px] text-zinc-700">{captured}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setProjectDraft(link.project)
                setEditing(true)
              }}
              className="rounded-md px-2.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(link.id)}
              className="rounded-md px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-red-950/50 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-violet-500/20 bg-zinc-900/50 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-violet-400/80">
          Editing
        </span>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          Done
        </button>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block truncate text-xs text-zinc-600 hover:text-violet-300"
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
          <p className="mb-1.5 text-[10px] text-zinc-600">
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
            value={formatTags(link.tags)}
            onChange={(e) => onUpdate(link.id, { tags: parseTags(e.target.value) })}
            placeholder="mcp, agents, routing"
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
