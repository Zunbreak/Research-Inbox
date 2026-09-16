import { useState } from 'react'
import type { LinkItem } from '../types'
import { CollapseToggle } from './CollapseToggle'
import { LinkCard } from './LinkCard'

interface LinkListProps {
  filteredLinks: LinkItem[]
  totalCount: number
  hasActiveFilters: boolean
  projectOptions: string[]
  onUpdate: (id: string, patch: Partial<LinkItem>) => void
  onDelete: (id: string) => void
  onFilter?: (patch: {
    search?: string
    status?: LinkItem['status'] | 'all'
    project?: string
    tag?: string
    domain?: string
  }) => void
}

function inboxLabel(filteredCount: number, totalCount: number, hasActiveFilters: boolean): string {
  if (totalCount === 0) return 'Inbox · empty'
  if (hasActiveFilters && filteredCount !== totalCount) {
    return `Inbox · ${filteredCount} matching`
  }
  return `Inbox · ${totalCount} links`
}

export function LinkList({
  filteredLinks,
  totalCount,
  hasActiveFilters,
  projectOptions,
  onUpdate,
  onDelete,
  onFilter,
}: LinkListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const forceExpanded = hasActiveFilters || totalCount === 0
  const expanded = forceExpanded || !collapsed

  const subtitle =
    hasActiveFilters && filteredLinks.length !== totalCount
      ? `${totalCount} total`
      : 'Browse or search above'

  if (totalCount === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-surface/10 px-6 py-12 text-center">
        <p className="mb-1 text-base font-medium text-foreground-tertiary">Your inbox is empty</p>
        <p className="mb-8 text-sm text-subtle">Save links, selected text, and notes, then find them later by search.</p>
        <ol className="mx-auto max-w-md space-y-4 text-left text-sm text-muted">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-project-chip-bg text-xs font-medium text-project-chip-text">
              1
            </span>
            <span>
              <strong className="font-medium text-foreground-tertiary">Paste URLs</strong> in Capture above, or load the browser extension.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-project-chip-bg text-xs font-medium text-project-chip-text">
              2
            </span>
            <span>
              <strong className="font-medium text-foreground-tertiary">Highlight text</strong> on a page before you save. That becomes searchable later.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-project-chip-bg text-xs font-medium text-project-chip-text">
              3
            </span>
            <span>
              <strong className="font-medium text-foreground-tertiary">Search</strong> by words you remember, not the URL.
            </span>
          </li>
        </ol>
      </div>
    )
  }

  if (!expanded) {
    return (
      <section className="rounded-lg border border-border/50 bg-surface/20">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface/40"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted">
              {inboxLabel(filteredLinks.length, totalCount, hasActiveFilters)}
            </span>
            <span className="ml-2 text-[11px] text-faint">{subtitle}</span>
          </div>
          <CollapseToggle expanded={false} />
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border/60 bg-surface/20">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5 text-left hover:bg-surface/40"
      >
        <div className="min-w-0">
          <span className="text-xs font-medium text-foreground-tertiary">
            {inboxLabel(filteredLinks.length, totalCount, hasActiveFilters)}
          </span>
          <span className="ml-2 text-[11px] text-faint">{subtitle}</span>
        </div>
        <CollapseToggle expanded={true} />
      </button>

      <div className="space-y-2 p-3 pt-2">
        {filteredLinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">No links match your filters.</p>
        ) : (
          filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              projectOptions={projectOptions}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFilter={onFilter}
            />
          ))
        )}
      </div>
    </section>
  )
}
