import { STATUSES } from '../constants'
import type { FilterState, LinkStatus } from '../types'
import { FilterPicker, type FilterPickerOption } from './FilterPicker'

interface FilterHubProps {
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  facetCounts: {
    status: Record<LinkStatus, number>
    projects: [string, number][]
    tags: [string, number][]
    domains: [string, number][]
  }
}

function toOptions(entries: [string, number][]): FilterPickerOption[] {
  return entries.map(([value, count]) => ({ value, label: value, count }))
}

export function FilterHub({ filters, onChange, facetCounts }: FilterHubProps) {
  const statusOptions: FilterPickerOption[] = STATUSES.map(({ value, label }) => ({
    value,
    label,
    count: facetCounts.status[value],
  }))

  const projectOptions = toOptions(facetCounts.projects)
  const tagOptions = toOptions(facetCounts.tags)
  const domainOptions = toOptions(facetCounts.domains)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPicker
        label="Project"
        value={filters.project}
        placeholder="All"
        searchPlaceholder="Search projects…"
        options={projectOptions}
        onSelect={(project) => onChange({ project })}
        onClear={() => onChange({ project: '' })}
      />
      <FilterPicker
        label="Tags"
        value={filters.tag}
        placeholder="All"
        searchPlaceholder="Search tags…"
        options={tagOptions}
        onSelect={(tag) => onChange({ tag })}
        onClear={() => onChange({ tag: '' })}
      />
      <FilterPicker
        label="Domains"
        value={filters.domain}
        placeholder="All"
        searchPlaceholder="Search domains…"
        options={domainOptions}
        onSelect={(domain) => onChange({ domain })}
        onClear={() => onChange({ domain: '' })}
      />
      <FilterPicker
        label="Status"
        value={filters.status === 'all' ? '' : filters.status}
        placeholder="All"
        searchPlaceholder="Search status…"
        options={statusOptions}
        onSelect={(status) => onChange({ status: status as LinkStatus })}
        onClear={() => onChange({ status: 'all' })}
      />
    </div>
  )
}
