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
        placeholder="Search everything you saved…"
        className="min-w-[240px] flex-1 rounded-lg border border-border-strong/60 bg-surface/60 px-4 py-2.5 text-sm text-foreground placeholder:text-faint focus:border-accent/60 focus:bg-surface focus:outline-none"
      />
      <span className="shrink-0 text-sm text-subtle">
        {resultCount} of {totalCount}
      </span>
    </div>
  )
}
