import { chromeStorageAdapter } from './chromeStorageAdapter.ts'
import { devStorageAdapter } from './devStorageAdapter.ts'
import { isExtensionContext } from './isExtensionContext.ts'
import type { StorageAdapter } from './types.ts'

let cached: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (!cached) {
    cached = isExtensionContext() ? chromeStorageAdapter : devStorageAdapter
  }
  return cached
}
