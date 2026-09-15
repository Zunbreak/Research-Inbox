import { useEffect, useState } from 'react'
import type { ImportBackupResult } from '../types.ts'

interface ImportBackupDialogProps {
  backupLinkCount: number
  currentLinkCount: number
  busy: boolean
  result: ImportBackupResult | null
  error: string | null
  onMerge: () => void
  onReplace: () => void
  onCancel: () => void
  onDone: () => void
}

function formatImportResult(result: ImportBackupResult): string {
  if (result.mode === 'replace') {
    return `Inbox replaced · ${result.total} links`
  }
  return `${result.added} added · ${result.alreadyExisted} already existed`
}

export function ImportBackupDialog({
  backupLinkCount,
  currentLinkCount,
  busy,
  result,
  error,
  onMerge,
  onReplace,
  onCancel,
  onDone,
}: ImportBackupDialogProps) {
  const [confirmReplace, setConfirmReplace] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (result) {
        onDone()
        return
      }
      if (confirmReplace) {
        setConfirmReplace(false)
        return
      }
      onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmReplace, result, onCancel, onDone])

  const handleBackdropClick = () => {
    if (result) return
    if (confirmReplace) {
      setConfirmReplace(false)
      return
    }
    onCancel()
  }

  const backupLabel = `${backupLinkCount} ${backupLinkCount === 1 ? 'link' : 'links'}`
  const currentLabel = `${currentLinkCount} ${currentLinkCount === 1 ? 'link' : 'links'}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-labelledby="import-backup-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 shadow-xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        {result ? (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-zinc-100">
              Import backup
            </h2>
            <div className="mt-3 space-y-4">
              <p className="text-xs text-emerald-400/90">{formatImportResult(result)}</p>
              <button
                type="button"
                onClick={onDone}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
          </>
        ) : confirmReplace ? (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-zinc-100">
              Replace entire inbox?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              This will replace your current {currentLabel} with {backupLabel} from this backup.
              This cannot be undone unless you have another backup.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmReplace(false)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onReplace}
                className="w-full rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Replace {backupLinkCount} links
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-zinc-100">
              Import backup
            </h2>

            {error && backupLinkCount === 0 ? (
              <div className="mt-3 space-y-4">
                <p className="text-xs text-red-400/90" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full rounded-md px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {backupLabel} found in this backup.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onMerge}
                    className="w-full rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-left text-xs text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"
                  >
                    <span className="font-medium">Merge</span>
                    <span className="mt-0.5 block text-[11px] text-violet-200/70">
                      Add only links that are not already in the inbox
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmReplace(true)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <span className="font-medium">Replace all</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      Replace the current inbox with this backup
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onCancel}
                    className="w-full rounded-md px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
