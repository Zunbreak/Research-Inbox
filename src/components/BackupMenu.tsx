import { useEffect, useRef, useState } from 'react'

interface BackupMenuProps {
  onExport: () => string
  onImport: (raw: string, mode: 'merge' | 'replace') => { added: number; skipped: number }
  linkCount: number
}

export function BackupMenu({ onExport, onImport, linkCount }: BackupMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const handleExport = () => {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `zunbreak-inbox-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const handleImport = async (file: File, mode: 'merge' | 'replace') => {
    const raw = await file.text()
    try {
      const { added, skipped } = onImport(raw, mode)
      const skippedNote = skipped > 0 ? ` (${skipped} invalid entries skipped)` : ''
      alert(
        mode === 'merge'
          ? `Imported ${added} new links${skippedNote}.`
          : `Replaced with ${added} links${skippedNote}.`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON file.'
      alert(message)
    }
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-800/80 bg-zinc-900/40 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Backup
        <span className="text-[10px] text-zinc-600">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[180px] rounded-md border border-zinc-800/80 bg-zinc-950 py-1 shadow-lg shadow-black/40"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleExport}
            disabled={linkCount === 0}
            className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => fileRef.current?.click()}
            className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900"
          >
            Import JSON
          </button>
          <p className="border-t border-zinc-800/80 px-3 py-2 text-[10px] leading-relaxed text-zinc-600">
            Extra copy beyond auto-backup to data/links.json
          </p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const replace = confirm(
            'Replace all existing links?\n\nOK = Replace all\nCancel = Merge (skip duplicates)',
          )
          void handleImport(file, replace ? 'replace' : 'merge')
          e.target.value = ''
        }}
      />
    </div>
  )
}
