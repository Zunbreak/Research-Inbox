import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  bootstrapTheme,
  loadThemePreference,
  readStoredPreference,
  saveThemePreference,
  subscribeToSystemTheme,
  subscribeToThemePreferenceChanges,
  type ThemePreference,
} from './theme.ts'

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void bootstrapTheme().then((loaded) => {
      if (active) {
        setPreference(loaded)
        setReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return

    return subscribeToSystemTheme(() => {
      if (readStoredPreference() === 'system') {
        applyTheme('system')
      }
    })
  }, [ready, preference])

  useEffect(() => {
    if (!ready) return

    return subscribeToThemePreferenceChanges(() => {
      void loadThemePreference().then((loaded) => {
        setPreference(loaded)
        applyTheme(loaded)
      })
    })
  }, [ready])

  const setThemePreference = useCallback(async (next: ThemePreference) => {
    setPreference(next)
    await saveThemePreference(next)
  }, [])

  return { preference, setThemePreference, ready }
}
