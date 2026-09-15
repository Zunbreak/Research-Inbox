import type { BackupState, LinkItem } from '../types.ts'

export interface InboxSnapshot {
  links: LinkItem[]
  recentProjects: string[]
  savedAt: string | null
}

export interface MutateResult extends InboxSnapshot {
  backupState: BackupState
}

export interface StorageAdapter {
  readonly mode: 'dev' | 'extension'
  readSnapshot(): Promise<InboxSnapshot>
  mutateSnapshot(
    mutator: (current: InboxSnapshot) => InboxSnapshot | Promise<InboxSnapshot>,
  ): Promise<MutateResult>
  initialSync(): Promise<MutateResult>
  subscribe(listener: (snapshot: InboxSnapshot) => void): () => void
}
