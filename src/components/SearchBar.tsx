import type { FilterState } from '../types'

interface SearchBarProps {
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  resultCount: number
  totalCount: number
}

export function SearchBar({ filters, onChange, resultCount, totalCount }: SearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        placeholder="Search URL, domain, project, tags, selected text, notes…"
        className="min-w-[240px] flex-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/60 focus:bg-zinc-900 focus:outline-none"
      />
      <span className="text-xs text-zinc-500">
        {resultCount} of {totalCount}
      </span>
    </div>
  )
}
