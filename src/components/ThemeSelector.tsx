import type { ThemePreference } from '../theme/theme.ts'
import { useTheme } from '../theme/useTheme.ts'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

export function ThemeSelector() {
  const { preference, setThemePreference, ready } = useTheme()

  if (!ready) return null

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-faint">Theme</span>
      <div
        className="flex rounded-md border border-border/60 bg-surface/30 p-0.5"
        role="group"
        aria-label="Theme"
      >
        {OPTIONS.map(({ value, label }) => {
          const active = preference === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => void setThemePreference(value)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                active
                  ? 'bg-sidebar-active-bg text-sidebar-active-text'
                  : 'text-muted hover:bg-surface hover:text-foreground-secondary'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
