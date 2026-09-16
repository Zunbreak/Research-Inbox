import { BackupMenu } from './components/BackupMenu'
import { BackupStatus } from './components/BackupStatus'
import { ActiveFilterChips } from './components/ActiveFilterChips'
import { FilterHub } from './components/FilterHub'
import { FilterSidebar } from './components/FilterSidebar'
import { LinkList } from './components/LinkList'
import { PastePanel } from './components/PastePanel'
import { SearchBar } from './components/SearchBar'
import { ThemeSelector } from './components/ThemeSelector'
import { useLinks } from './hooks/useLinks'

export default function App() {
  const {
    links,
    filteredLinks,
    filters,
    setFilters,
    projectOptions,
    facetCounts,
    lastCapture,
    backupState,
    lastBackupAt,
    lastExportedAt,
    storageMode,
    captureFromText,
    updateLink,
    deleteLink,
    exportBackup,
    importJson,
  } = useLinks()

  const applyFilters = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.project ||
    filters.tag ||
    filters.domain

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      project: '',
      tag: '',
      domain: '',
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface-elevated px-4 py-3.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Research Inbox</h1>
            <p className="text-sm text-subtle">Capture now. Find later. Close the tabs.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <BackupStatus
              state={backupState}
              lastBackupAt={lastBackupAt}
              storageMode={storageMode}
            />
            <ThemeSelector />
            <BackupMenu
              onExport={exportBackup}
              onImport={importJson}
              linkCount={links.length}
              lastExportedAt={lastExportedAt}
              storageMode={storageMode}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <FilterSidebar
          filters={filters}
          onChange={applyFilters}
          facetCounts={{
            status: facetCounts.status,
            projects: facetCounts.projects,
          }}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <PastePanel
            onCapture={captureFromText}
            lastCapture={lastCapture}
            projectOptions={projectOptions}
            defaultCollapsed={links.length > 0}
          />

          <section className="space-y-3 rounded-lg border border-border/50 bg-surface/20 p-3.5">
            <SearchBar
              filters={filters}
              onChange={applyFilters}
              resultCount={filteredLinks.length}
              totalCount={links.length}
            />
            <FilterHub
              filters={filters}
              onChange={applyFilters}
              facetCounts={{
                projects: facetCounts.projects,
                tags: facetCounts.tags,
                domains: facetCounts.domains,
              }}
            />
            <ActiveFilterChips
              filters={filters}
              onChange={applyFilters}
              onClearAll={clearAllFilters}
            />
          </section>

          <LinkList
            filteredLinks={filteredLinks}
            totalCount={links.length}
            hasActiveFilters={Boolean(hasActiveFilters)}
            projectOptions={projectOptions}
            onUpdate={updateLink}
            onDelete={deleteLink}
            onFilter={applyFilters}
          />
        </main>
      </div>

      <footer className="border-t border-border/80 px-4 py-2">
        <p className="mx-auto max-w-7xl text-center text-[11px] text-faint">
          Built by Zunbreak
        </p>
      </footer>
    </div>
  )
}
