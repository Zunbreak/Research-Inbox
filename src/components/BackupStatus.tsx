import type { BackupState } from '../types'
import { formatCapturedAt } from '../utils/date'

interface BackupStatusProps {
  state: BackupState
  lastBackupAt: string | null
}

export function BackupStatus({ state, lastBackupAt }: BackupStatusProps) {
  const dotClass =
    state === 'active'
      ? 'bg-emerald-400/90'
      : state === 'saving'
        ? 'bg-amber-400 animate-pulse'
        : state === 'loading'
          ? 'bg-zinc-500 animate-pulse'
          : state === 'error'
            ? 'bg-red-400'
            : 'bg-zinc-600'

  const label =
    state === 'loading'
      ? 'Syncing…'
      : state === 'saving'
        ? 'Saving…'
        : state === 'active'
          ? lastBackupAt
            ? `Auto-backup · ${formatCapturedAt(lastBackupAt)}`
            : 'Auto-backup active'
          : state === 'error'
            ? 'Backup failed'
            : 'Backup offline'

  return (
    <div
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-zinc-500"
      title="Links auto-save to data/links.json while dev server runs"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  )
}
