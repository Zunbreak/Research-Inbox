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
      <div className="rounded-lg border border-dashed border-zinc-800/60 py-16 text-center">
        <p className="text-sm text-zinc-500">No links yet. Paste URLs or use the extension.</p>
      </div>
    )
  }

  if (!expanded) {
    return (
      <section className="rounded-lg border border-zinc-800/50 bg-zinc-900/20">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-zinc-900/40"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-zinc-400">
              {inboxLabel(filteredLinks.length, totalCount, hasActiveFilters)}
            </span>
            <span className="ml-2 text-[11px] text-zinc-600">{subtitle}</span>
          </div>
          <CollapseToggle expanded={false} />
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-900/20">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex w-full items-center justify-between gap-3 border-b border-zinc-800/40 px-4 py-2.5 text-left hover:bg-zinc-900/40"
      >
        <div className="min-w-0">
          <span className="text-xs font-medium text-zinc-300">
            {inboxLabel(filteredLinks.length, totalCount, hasActiveFilters)}
          </span>
          <span className="ml-2 text-[11px] text-zinc-600">{subtitle}</span>
        </div>
        <CollapseToggle expanded={true} />
      </button>

      <div className="space-y-2 p-3 pt-2">
        {filteredLinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No links match your filters.</p>
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
