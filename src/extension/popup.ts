import { DEFAULT_PROJECT } from '../constants.ts'
import { addCapturedLink, sortLinksByCapturedAt } from '../lib/capture.ts'
import { parseCaptureLinkInput } from '../lib/validation.ts'
import { mutateChromePayload, readChromePayload } from '../storage/payload.ts'
import type { CaptureLinkInput } from '../types.ts'
import { normalizeProject } from '../utils/project.ts'
import { parseDomain } from '../utils/url.ts'

const POPUP_PREFS_KEY = 'popupPrefs'

interface PopupPrefs {
  project?: string
  tags?: string
  whySaved?: string
  includeSelected?: boolean
}

interface PageMeta {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  headings: string[]
  selectedText?: string
}

const projectSelect = document.getElementById('project-select') as HTMLSelectElement
const projectCustom = document.getElementById('project-custom') as HTMLInputElement
const tagsInput = document.getElementById('tags') as HTMLInputElement
const whySavedInput = document.getElementById('why-saved') as HTMLTextAreaElement
const includeSelected = document.getElementById('include-selected') as HTMLInputElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
const openInboxBtn = document.getElementById('open-inbox') as HTMLButtonElement
const statusEl = document.getElementById('status') as HTMLParagraphElement
const pagePreview = document.getElementById('page-preview') as HTMLParagraphElement
const metaPreview = document.getElementById('meta-preview') as HTMLParagraphElement
const selectedTextPreview = document.getElementById('selected-text-preview') as HTMLDivElement
const selectedTextBody = document.getElementById('selected-text-body') as HTMLParagraphElement

let activeTab: chrome.tabs.Tab | null = null
let pageMeta: PageMeta | null = null
let projectOptions: string[] = []

void init()

async function init() {
  openInboxBtn.addEventListener('click', () => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('inbox.html') })
  })

  await loadProjectOptions()
  await loadPreferences()
  await loadActiveTab()
  await loadPageMetadata()
}

function uniqueProjects(projects: string[]): string[] {
  const seen = new Set<string>()
  const next: string[] = []

  for (const project of projects) {
    const trimmed = project?.trim()
    if (!trimmed || trimmed === DEFAULT_PROJECT) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(trimmed)
  }

  return next
}

async function loadProjectOptions() {
  const payload = await readChromePayload()
  projectOptions = uniqueProjects([
    ...payload.recentProjects,
    ...payload.links.map((link) => link.project),
  ])
  renderProjectSelect()
}

function renderProjectSelect(selected = projectSelect.value) {
  projectSelect.innerHTML = [
    '<option value="">No default project</option>',
    ...projectOptions.map(
      (project) =>
        `<option value="${project.replace(/"/g, '&quot;')}">${project}</option>`,
    ),
  ].join('')

  if (selected && projectOptions.some((project) => project === selected)) {
    projectSelect.value = selected
  } else {
    projectSelect.value = ''
  }
}

async function loadPreferences() {
  const stored = await chrome.storage.local.get(POPUP_PREFS_KEY)
  const prefs = (stored[POPUP_PREFS_KEY] ?? {}) as PopupPrefs

  if (prefs.project) {
    if (projectOptions.includes(prefs.project)) {
      projectSelect.value = prefs.project
      projectCustom.value = ''
    } else {
      projectSelect.value = ''
      projectCustom.value = prefs.project
    }
  }
  if (prefs.tags) tagsInput.value = prefs.tags
  if (prefs.whySaved) whySavedInput.value = prefs.whySaved
  if (typeof prefs.includeSelected === 'boolean') {
    includeSelected.checked = prefs.includeSelected
  }
}

async function savePreferences() {
  const prefs: PopupPrefs = {
    project: getProject(),
    tags: tagsInput.value.trim(),
    whySaved: whySavedInput.value.trim(),
    includeSelected: includeSelected.checked,
  }
  await chrome.storage.local.set({ [POPUP_PREFS_KEY]: prefs })
}

function getProject(): string {
  return projectCustom.value.trim() || projectSelect.value || DEFAULT_PROJECT
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
}

function truncate(text: string, max = 220): string {
  if (!text || text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function renderSelectedTextPreview(text?: string) {
  const trimmed = text?.trim()
  if (!trimmed) {
    selectedTextPreview.classList.add('hidden')
    selectedTextBody.textContent = ''
    return
  }

  selectedTextBody.textContent = `“${truncate(trimmed)}”`
  selectedTextPreview.classList.toggle('hidden', !includeSelected.checked)
}

function renderMetaPreview(meta: PageMeta) {
  const previewParts = [
    meta.description || meta.ogDescription,
    meta.headings?.slice(0, 2).join(' · '),
  ].filter(Boolean)

  metaPreview.textContent = previewParts.join(' | ') || 'No page metadata found.'
}

function setStatus(message: string, type = '') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`.trim()
}

async function loadActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  activeTab = tab ?? null

  if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://')) {
    pagePreview.textContent = 'Cannot capture this page type.'
    saveBtn.disabled = true
    return
  }

  pagePreview.textContent = `${tab.title || 'Untitled'} · ${parseDomain(tab.url)}`
}

function capturePageMetadata() {
  const meta = (name: string) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || ''
  const prop = (property: string) =>
    document.querySelector(`meta[property="${property}"]`)?.getAttribute('content')?.trim() ||
    ''

  const headings = [...document.querySelectorAll('h1, h2')]
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 8) as string[]

  return {
    title: document.title?.trim() || '',
    description: meta('description'),
    ogTitle: prop('og:title'),
    ogDescription: prop('og:description'),
    headings,
  }
}

function captureLiveSelection() {
  return window.getSelection()?.toString()?.trim() ?? ''
}

async function getSelectedText(tab: chrome.tabs.Tab): Promise<string> {
  if (!tab.id) return ''

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: captureLiveSelection,
    })
    return (
      results
        .map((entry) => entry.result)
        .filter(Boolean)
        .sort((a, b) => (b?.length ?? 0) - (a?.length ?? 0))[0] ?? ''
    )
  } catch {
    return ''
  }
}

async function loadPageMetadata() {
  if (!activeTab?.id || saveBtn.disabled) return

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: capturePageMetadata,
    })
    pageMeta = result as PageMeta
    pageMeta.selectedText = await getSelectedText(activeTab)

    renderMetaPreview(pageMeta)
    renderSelectedTextPreview(pageMeta.selectedText)
  } catch {
    pageMeta = {
      title: activeTab.title || '',
      description: '',
      ogTitle: '',
      ogDescription: '',
      headings: [],
      selectedText: await getSelectedText(activeTab),
    }
    metaPreview.textContent = 'Metadata capture limited on this page.'
    renderSelectedTextPreview(pageMeta.selectedText)
  }
}

includeSelected.addEventListener('change', () => {
  renderSelectedTextPreview(pageMeta?.selectedText)
})

saveBtn.addEventListener('click', () => {
  void handleSave()
})

async function handleSave() {
  if (!activeTab?.url) return

  saveBtn.disabled = true
  setStatus('Saving…')

  try {
    await loadPageMetadata()

    const selectedText =
      includeSelected.checked && pageMeta?.selectedText
        ? pageMeta.selectedText
        : undefined

    const rawInput: CaptureLinkInput = {
      url: activeTab.url,
      title: pageMeta?.title || activeTab.title || '',
      description: pageMeta?.description || undefined,
      ogTitle: pageMeta?.ogTitle || undefined,
      ogDescription: pageMeta?.ogDescription || undefined,
      headings: pageMeta?.headings?.length ? pageMeta.headings : undefined,
      selectedText,
      source: 'extension',
      capturedFrom: 'chrome-extension',
      project: getProject(),
      tags: parseTags(tagsInput.value),
      whySaved: whySavedInput.value.trim() || undefined,
    }

    const validated = parseCaptureLinkInput(rawInput)
    if (!validated.ok) {
      setStatus(validated.error, 'error')
      return
    }

    const input = validated.value
    const outcome = { status: 'created' as 'created' | 'duplicate' }

    await mutateChromePayload(async (current) => {
      const { links, result } = addCapturedLink(current.links, {
        ...input,
        source: 'extension',
        project: input.project ? normalizeProject(input.project) : undefined,
      })
      outcome.status = result.status === 'duplicate' ? 'duplicate' : 'created'

      if (result.status !== 'created') {
        return current
      }

      const project = input.project ? normalizeProject(input.project) : DEFAULT_PROJECT
      const recentProjects = [
        project,
        ...current.recentProjects.filter((item) => item.toLowerCase() !== project.toLowerCase()),
      ].slice(0, 12)

      return {
        ...current,
        links: sortLinksByCapturedAt(links),
        recentProjects,
      }
    })

    await savePreferences()
    await loadProjectOptions()

    if (outcome.status === 'duplicate') {
      setStatus('Already in inbox.', 'warn')
    } else {
      setStatus('Saved to inbox.', 'ok')
    }
  } catch {
    setStatus('Could not save to inbox.', 'error')
  } finally {
    saveBtn.disabled = false
  }
}
