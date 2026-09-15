import { useRef, useState } from 'react'
import type { CaptureResult } from '../types'
import { CollapseToggle } from './CollapseToggle'

interface PastePanelProps {
  onCapture: (
    text: string,
    defaultProject?: string,
    defaultTags?: string,
  ) => CaptureResult | Promise<CaptureResult>
  lastCapture: CaptureResult | null
  projectOptions: string[]
  defaultCollapsed?: boolean
}

export function PastePanel({
  onCapture,
  lastCapture,
  projectOptions,
  defaultCollapsed = false,
}: PastePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [text, setText] = useState('')
  const [defaultProject, setDefaultProject] = useState('')
  const [customProject, setCustomProject] = useState('')
  const [defaultTags, setDefaultTags] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    const project = customProject.trim() || defaultProject
    const result = await onCapture(text, project || undefined, defaultTags.trim() || undefined)
    if (result.added > 0) {
      setText('')
      setCollapsed(true)
    }
  }

  const handleFileImport = async (file: File) => {
    const content = await file.text()
    const project = customProject.trim() || defaultProject
    const result = await onCapture(content, project || undefined, defaultTags.trim() || undefined)
    if (result.added > 0) {
      setCollapsed(true)
    }
  }

  const lineCount = text.split(/\r?\n/).filter((line) => line.trim()).length

  if (collapsed) {
    return (
      <section className="rounded-lg border border-zinc-800/50 bg-zinc-900/20">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-zinc-900/40"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-zinc-400">Capture</span>
            <span className="ml-2 text-[11px] text-zinc-600">Paste URLs · tags · import .txt</span>
          </div>
          <CollapseToggle expanded={false} />
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="-mx-1 mb-3 flex w-[calc(100%+0.5rem)] items-center justify-between gap-3 rounded-md px-1 py-1 text-left hover:bg-zinc-900/40"
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold text-zinc-200">Capture</span>
          <span className="ml-2 text-xs text-zinc-600">Paste URLs — one per line</span>
        </div>
        <CollapseToggle expanded={true} />
      </button>

      <div className="mb-3 space-y-3">
        <p className="text-xs text-zinc-600">
          Default project · pick existing or type a new name
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={defaultProject}
            onChange={(e) => {
              setDefaultProject(e.target.value)
              setCustomProject('')
            }}
            className="rounded-md border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2 text-sm text-zinc-200"
          >
            <option value="">No default project</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={customProject}
            onChange={(e) => setCustomProject(e.target.value)}
            placeholder="New project name…"
            className="min-w-[140px] flex-1 rounded-md border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <input
          type="text"
          value={defaultTags}
          onChange={(e) => setDefaultTags(e.target.value)}
          placeholder="Tags · mcp, agents, docs"
          className="w-full rounded-md border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="https://example.com/article&#10;https://github.com/something&#10;..."
        rows={4}
        className="mb-3 w-full resize-y rounded-md border border-zinc-800/80 bg-zinc-950/80 px-3 py-2.5 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-zinc-800/80 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
        >
          Import .txt
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFileImport(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim()}
          className="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save {lineCount > 0 ? `(${lineCount})` : ''}
        </button>
      </div>

      {lastCapture && (
        <p className="mt-2 text-[11px] text-zinc-600">
          Last save: {lastCapture.added} added, {lastCapture.duplicates} duplicates skipped
          {lastCapture.invalid > 0 ? `, ${lastCapture.invalid} invalid lines` : ''}
        </p>
      )}
    </section>
  )
}
