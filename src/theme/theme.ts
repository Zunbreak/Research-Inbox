import { THEME_PREFERENCE_KEY } from '../constants.ts'
import { isExtensionContext } from '../storage/isExtensionContext.ts'

export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

const VALID_PREFERENCES = new Set<ThemePreference>(['dark', 'light', 'system'])

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference)
  document.documentElement.dataset.theme = resolved
  return resolved
}

export function readStoredPreference(): ThemePreference {
  const raw = localStorage.getItem(THEME_PREFERENCE_KEY)
  if (raw && VALID_PREFERENCES.has(raw as ThemePreference)) {
    return raw as ThemePreference
  }
  return 'dark'
}

export function persistPreferenceLocally(preference: ThemePreference): void {
  localStorage.setItem(THEME_PREFERENCE_KEY, preference)
}

export async function loadThemePreference(): Promise<ThemePreference> {
  if (isExtensionContext()) {
    try {
      const stored = await chrome.storage.local.get(THEME_PREFERENCE_KEY)
      const value = stored[THEME_PREFERENCE_KEY]
      if (typeof value === 'string' && VALID_PREFERENCES.has(value as ThemePreference)) {
        persistPreferenceLocally(value as ThemePreference)
        return value as ThemePreference
      }
    } catch {
      // Fall back to localStorage/default.
    }
  }

  return readStoredPreference()
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  persistPreferenceLocally(preference)
  applyTheme(preference)

  if (isExtensionContext()) {
    await chrome.storage.local.set({ [THEME_PREFERENCE_KEY]: preference })
  }
}

export function subscribeToSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => onChange()
  media.addEventListener('change', handler)
  return () => media.removeEventListener('change', handler)
}

export function subscribeToThemePreferenceChanges(onChange: () => void): () => void {
  if (!isExtensionContext()) {
    return () => {}
  }

  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'local' || !(THEME_PREFERENCE_KEY in changes)) return
    onChange()
  }

  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

export async function bootstrapTheme(): Promise<ThemePreference> {
  const preference = await loadThemePreference()
  applyTheme(preference)
  return preference
}
