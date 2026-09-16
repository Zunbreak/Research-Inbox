import { useState, type ReactNode } from 'react'
import { STATUSES } from '../constants'
import type { FilterState, LinkStatus } from '../types'

const VISIBLE_PROJECT_COUNT = 6

interface FilterSidebarProps {
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  facetCounts: {
    status: Record<LinkStatus, number>
    projects: [string, number][]
  }
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
        active
          ? 'bg-accent/20 text-accent-foreground-soft'
          : 'text-muted hover:bg-border hover:text-foreground-secondary'
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-2 shrink-0 text-faint">{count}</span>}
    </button>
  )
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export function FilterSidebar({ filters, onChange, facetCounts }: FilterSidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(false)
  const clearFacet = (key: keyof FilterState) => onChange({ [key]: key === 'status' ? 'all' : '' })

  const projects = facetCounts.projects
  const hasOverflow = projects.length > VISIBLE_PROJECT_COUNT
  const activeHidden =
    Boolean(filters.project) &&
    projects.findIndex(([project]) => project === filters.project) >= VISIBLE_PROJECT_COUNT

  const expanded = projectsExpanded || activeHidden
  const visibleProjects =
    expanded || !hasOverflow ? projects : projects.slice(0, VISIBLE_PROJECT_COUNT)
  const hiddenCount = projects.length - VISIBLE_PROJECT_COUNT

  return (
    <aside className="w-44 shrink-0 overflow-y-auto border-r border-border bg-surface-elevated/50 p-3">
      <FilterSection title="Status">
        <FilterButton
          active={filters.status === 'all'}
          label="All"
          count={Object.values(facetCounts.status).reduce((a, b) => a + b, 0)}
          onClick={() => onChange({ status: 'all' })}
        />
        {STATUSES.map(({ value, label }) => (
          <FilterButton
            key={value}
            active={filters.status === value}
            label={label}
            count={facetCounts.status[value]}
            onClick={() => onChange({ status: value })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Project">
        <FilterButton
          active={!filters.project}
          label="All projects"
          onClick={() => clearFacet('project')}
        />
        {visibleProjects.map(([project, count]) => (
          <FilterButton
            key={project}
            active={filters.project === project}
            label={project}
            count={count}
            onClick={() => onChange({ project })}
          />
        ))}
        {hasOverflow && (
          <button
            type="button"
            onClick={() => setProjectsExpanded((open) => !open)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-subtle transition-colors hover:bg-border/60 hover:text-foreground-tertiary"
          >
            <span>{expanded ? 'Show less' : `Show all (${projects.length})`}</span>
            <span className="ml-2 shrink-0 text-faint" aria-hidden="true">
              {expanded ? '▴' : `+${hiddenCount}`}
            </span>
          </button>
        )}
      </FilterSection>
    </aside>
  )
}
