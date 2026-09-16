import { STATUSES } from '../constants'
import type { FilterState } from '../types'

interface ActiveFilterChip {
  key: keyof FilterState
  label: string
  clear: Partial<FilterState>
}

interface ActiveFilterChipsProps {
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  onClearAll: () => void
}

function statusLabel(status: FilterState['status']): string {
  if (status === 'all') return ''
  return STATUSES.find((item) => item.value === status)?.label ?? status
}

export function ActiveFilterChips({ filters, onChange, onClearAll }: ActiveFilterChipsProps) {
  const chips: ActiveFilterChip[] = []

  if (filters.domain) {
    chips.push({
      key: 'domain',
      label: filters.domain,
      clear: { domain: '' },
    })
  }
  if (filters.tag) {
    chips.push({
      key: 'tag',
      label: filters.tag,
      clear: { tag: '' },
    })
  }
  if (filters.project) {
    chips.push({
      key: 'project',
      label: filters.project,
      clear: { project: '' },
    })
  }
  if (filters.status !== 'all') {
    chips.push({
      key: 'status',
      label: statusLabel(filters.status),
      clear: { status: 'all' },
    })
  }
  if (filters.search.trim()) {
    chips.push({
      key: 'search',
      label: `"${filters.search.trim()}"`,
      clear: { search: '' },
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong/60 bg-surface/80 px-2.5 py-1 text-xs text-foreground-tertiary transition-colors hover:border-faint hover:bg-border"
        >
          <span className="truncate">{chip.label}</span>
          <span className="text-subtle">✕</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-faint hover:text-muted"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
