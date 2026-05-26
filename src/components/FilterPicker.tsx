import { useEffect, useMemo, useRef, useState } from 'react'

export interface FilterPickerOption {
  value: string
  label: string
  count?: number
}

interface FilterPickerProps {
  label: string
  value: string
  placeholder: string
  searchPlaceholder: string
  options: FilterPickerOption[]
  onSelect: (value: string) => void
  onClear: () => void
}

export function FilterPicker({
  label,
  value,
  placeholder,
  searchPlaceholder,
  options,
  onSelect,
  onClear,
}: FilterPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)
  const triggerLabel = selected?.label ?? placeholder

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        option.value.toLowerCase().includes(needle),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (next: string) => {
    onSelect(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
          value
            ? 'border-violet-500/40 bg-violet-950/30 text-violet-200'
            : 'border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
        }`}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</span>
        <span className="max-w-[140px] truncate">{triggerLabel}</span>
        <span className="text-zinc-600">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-zinc-700/80 bg-zinc-950 p-2 shadow-xl shadow-black/40">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
            className="mb-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />

          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onClear()
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                Clear {label.toLowerCase()}
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-zinc-600">No matches</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    option.value === value
                      ? 'bg-violet-600/20 text-violet-200'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="shrink-0 text-zinc-600">{option.count}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
