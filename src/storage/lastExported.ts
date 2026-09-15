import { LAST_EXPORTED_KEY } from '../constants.ts'
import { isExtensionContext } from './isExtensionContext.ts'

export async function readLastExportedAt(): Promise<string | null> {
  if (isExtensionContext()) {
    const stored = await chrome.storage.local.get(LAST_EXPORTED_KEY)
    const value = stored[LAST_EXPORTED_KEY]
    return typeof value === 'string' ? value : null
  }

  try {
    return localStorage.getItem(LAST_EXPORTED_KEY)
  } catch {
    return null
  }
}

export async function writeLastExportedAt(savedAt: string): Promise<void> {
  if (isExtensionContext()) {
    await chrome.storage.local.set({ [LAST_EXPORTED_KEY]: savedAt })
    return
  }

  localStorage.setItem(LAST_EXPORTED_KEY, savedAt)
}
