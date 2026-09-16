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
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-labelledby="import-backup-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-border/80 bg-surface-elevated p-4 shadow-xl shadow-overlay/50"
        onClick={(event) => event.stopPropagation()}
      >
        {result ? (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-foreground">
              Import backup
            </h2>
            <div className="mt-3 space-y-4">
              <p className="text-xs text-success/90">{formatImportResult(result)}</p>
              <button
                type="button"
                onClick={onDone}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-xs text-foreground-secondary hover:bg-border"
              >
                Done
              </button>
            </div>
          </>
        ) : confirmReplace ? (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-foreground">
              Replace entire inbox?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              This will replace your current {currentLabel} with {backupLabel} from this backup.
              This cannot be undone unless you have another backup.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmReplace(false)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-xs text-foreground-secondary hover:bg-border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onReplace}
                className="w-full rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-medium text-danger-foreground hover:bg-danger/20 disabled:opacity-50"
              >
                Replace {backupLinkCount} links
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="import-backup-title" className="text-sm font-medium text-foreground">
              Import backup
            </h2>

            {error && backupLinkCount === 0 ? (
              <div className="mt-3 space-y-4">
                <p className="text-xs text-danger/90" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full rounded-md px-3 py-2 text-xs text-subtle hover:text-foreground-tertiary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {backupLabel} found in this backup.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onMerge}
                    className="w-full rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-left text-xs text-foreground hover:bg-accent/20 disabled:opacity-50"
                  >
                    <span className="font-medium">Merge</span>
                    <span className="mt-0.5 block text-[11px] text-accent-foreground-soft/70">
                      Add only links that are not already in the inbox
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmReplace(true)}
                    className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-left text-xs text-foreground-tertiary hover:bg-border disabled:opacity-50"
                  >
                    <span className="font-medium">Replace all</span>
                    <span className="mt-0.5 block text-[11px] text-subtle">
                      Replace the current inbox with this backup
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onCancel}
                    className="w-full rounded-md px-3 py-2 text-xs text-subtle hover:text-foreground-tertiary disabled:opacity-50"
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
