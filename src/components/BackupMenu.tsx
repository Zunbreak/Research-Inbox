import { useEffect, useRef, useState } from 'react'
import { parseImportPayloadStrict } from '../lib/validation.ts'
import type { ImportBackupResult } from '../types.ts'
import { formatCapturedAt } from '../utils/date.ts'
import { ImportBackupDialog } from './ImportBackupDialog.tsx'

interface BackupMenuProps {
  onExport: () => string | Promise<string>
  onImport: (raw: string, mode: 'merge' | 'replace') => Promise<ImportBackupResult>
  linkCount: number
  lastExportedAt: string | null
  storageMode?: 'dev' | 'extension'
}

interface ImportDraft {
  raw: string
  backupLinkCount: number
}

export function BackupMenu({
  onExport,
  onImport,
  linkCount,
  lastExportedAt,
  storageMode = 'dev',
}: BackupMenuProps) {
  const [open, setOpen] = useState(false)
  const [importDraft, setImportDraft] = useState<ImportDraft | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState<ImportBackupResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
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

  const closeImportDialog = () => {
    setImportDraft(null)
    setImportResult(null)
    setImportError(null)
    setImportBusy(false)
  }

  const handleExport = async () => {
    const json = await onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `zunbreak-inbox-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const runImport = async (mode: 'merge' | 'replace') => {
    if (!importDraft) return
    setImportBusy(true)
    setImportError(null)

    try {
      const result = await onImport(importDraft.raw, mode)
      setImportResult(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON file.'
      setImportError(message)
    } finally {
      setImportBusy(false)
    }
  }

  const handleFileSelected = async (file: File) => {
    const raw = await file.text()
    const parsed = parseImportPayloadStrict(raw)
    if (!parsed.ok) {
      setImportDraft({ raw: '', backupLinkCount: 0 })
      setImportError(parsed.error)
      setImportResult(null)
      return
    }

    setImportDraft({ raw, backupLinkCount: parsed.value.links.length })
    setImportError(null)
    setImportResult(null)
    setOpen(false)
  }

  const lastExportedLabel = lastExportedAt
    ? formatCapturedAt(lastExportedAt)
    : 'No backup created yet'

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800/80 bg-zinc-900/40 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Backup & Restore
          <span className="text-[10px] text-zinc-600">{open ? '▴' : '▾'}</span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1.5 min-w-[210px] rounded-md border border-zinc-800/80 bg-zinc-950 py-1 shadow-lg shadow-black/40"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleExport()}
              disabled={linkCount === 0}
              className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export backup
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => fileRef.current?.click()}
              className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900"
            >
              Import backup
            </button>
            <div className="border-t border-zinc-800/80 px-3 py-2">
              <p className="text-[10px] text-zinc-500">Last exported</p>
              <p
                className={`mt-0.5 text-[11px] ${lastExportedAt ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                {lastExportedLabel}
              </p>
            </div>
            <p className="border-t border-zinc-800/80 px-3 py-2 text-[10px] leading-relaxed text-zinc-600">
              {storageMode === 'extension'
                ? 'Manual copy of your local extension data'
                : 'Extra copy beyond auto-backup to data/links.json'}
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
            void handleFileSelected(file)
            e.target.value = ''
          }}
        />
      </div>

      {importDraft && (
        <ImportBackupDialog
          backupLinkCount={importDraft.backupLinkCount}
          currentLinkCount={linkCount}
          busy={importBusy}
          result={importResult}
          error={importError}
          onMerge={() => void runImport('merge')}
          onReplace={() => void runImport('replace')}
          onCancel={closeImportDialog}
          onDone={closeImportDialog}
        />
      )}
    </>
  )
}
