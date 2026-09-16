import type { BackupState } from '../types.ts'
import { formatCapturedAt } from '../utils/date.ts'

interface BackupStatusProps {
  state: BackupState
  lastBackupAt: string | null
  storageMode?: 'dev' | 'extension'
}

export function BackupStatus({ state, lastBackupAt, storageMode = 'dev' }: BackupStatusProps) {
  const dotClass =
    state === 'active'
      ? 'bg-success/90'
      : state === 'saving'
        ? 'bg-warning animate-pulse'
        : state === 'loading'
          ? 'bg-subtle animate-pulse'
          : state === 'error'
            ? 'bg-danger'
            : 'bg-faint'

  const label =
    state === 'loading'
      ? 'Syncing…'
      : state === 'saving'
        ? 'Saving…'
        : state === 'active'
          ? storageMode === 'extension'
            ? lastBackupAt
              ? `Saved locally · ${formatCapturedAt(lastBackupAt)}`
              : 'Saved locally in extension'
            : lastBackupAt
              ? `Auto-backup · ${formatCapturedAt(lastBackupAt)}`
              : 'Auto-backup active'
          : state === 'error'
            ? 'Backup failed'
            : storageMode === 'extension'
              ? 'Storage offline'
              : 'Backup offline'

  const title =
    storageMode === 'extension'
      ? 'Links are stored in chrome.storage.local'
      : 'Links auto-save to data/links.json while dev server runs'

  return (
    <div
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-subtle"
      title={title}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  )
}
