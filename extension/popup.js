const INBOX_API = 'http://localhost:5173/api/capture-link'

const DEFAULT_PROJECTS = [
  'Work',
  'Personal',
  'Learning',
  'Research',
  'Inspiration',
  'Unsorted',
]

const projectSelect = document.getElementById('project-select')
const projectCustom = document.getElementById('project-custom')
const tagsInput = document.getElementById('tags')
const whySavedInput = document.getElementById('why-saved')
const includeSelected = document.getElementById('include-selected')
const saveBtn = document.getElementById('save-btn')
const statusEl = document.getElementById('status')
const pagePreview = document.getElementById('page-preview')
const metaPreview = document.getElementById('meta-preview')

let activeTab = null
let pageMeta = null

init()

async function init() {
  populateProjects()
  await loadPreferences()
  await loadActiveTab()
  await loadPageMetadata()
}

function populateProjects() {
  projectSelect.innerHTML = DEFAULT_PROJECTS.map(
    (project) => `<option value="${project}">${project}</option>`,
  ).join('')
  projectSelect.value = 'Unsorted'
}

async function loadPreferences() {
  const prefs = await chrome.storage.local.get([
    'project',
    'tags',
    'whySaved',
    'includeSelected',
  ])

  if (prefs.project) {
    if (DEFAULT_PROJECTS.includes(prefs.project)) {
      projectSelect.value = prefs.project
    } else {
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
  await chrome.storage.local.set({
    project: getProject(),
    tags: tagsInput.value.trim(),
    whySaved: whySavedInput.value.trim(),
    includeSelected: includeSelected.checked,
  })
}

function getProject() {
  return projectCustom.value.trim() || projectSelect.value || 'Unsorted'
}

function parseTags(raw) {
  return raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
}

function parseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
}

function setStatus(message, type = '') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`.trim()
}

async function loadActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  activeTab = tab

  if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://')) {
    pagePreview.textContent = 'Cannot capture this page type.'
    saveBtn.disabled = true
    return
  }

  pagePreview.textContent = `${tab.title || 'Untitled'} · ${parseDomain(tab.url)}`
}

function capturePageMetadata() {
  const meta = (name) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || ''
  const prop = (property) =>
    document.querySelector(`meta[property="${property}"]`)?.getAttribute('content')?.trim() ||
    ''

  const headings = [...document.querySelectorAll('h1, h2')]
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 8)

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

async function getSelectedText(tab) {
  if (!tab?.id) return ''

  let live = ''
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: captureLiveSelection,
    })
    live =
      results
        .map((entry) => entry.result)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] ?? ''
  } catch {
    live = ''
  }

  if (live) return live

  return ''
}

async function loadPageMetadata() {
  if (!activeTab?.id || saveBtn.disabled) return

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: capturePageMetadata,
    })
    pageMeta = result
    pageMeta.selectedText = await getSelectedText(activeTab)

    const previewParts = [
      pageMeta.description || pageMeta.ogDescription,
      pageMeta.headings?.slice(0, 2).join(' · '),
      pageMeta.selectedText ? `Selected: ${pageMeta.selectedText.slice(0, 80)}…` : '',
    ].filter(Boolean)

    metaPreview.textContent = previewParts.join(' | ') || 'No page metadata found.'
  } catch {
    pageMeta = {
      title: activeTab.title || '',
      description: '',
      ogTitle: '',
      ogDescription: '',
      headings: [],
      selectedText: await getSelectedText(activeTab),
    }
    metaPreview.textContent = pageMeta.selectedText
      ? `Selected: ${pageMeta.selectedText.slice(0, 80)}…`
      : 'Metadata capture limited on this page.'
  }
}

saveBtn.addEventListener('click', async () => {
  if (!activeTab?.url) return

  saveBtn.disabled = true
  setStatus('Saving…')

  try {
    await loadPageMetadata()

    const selectedText =
      includeSelected.checked && pageMeta?.selectedText
        ? pageMeta.selectedText
        : undefined

    const payload = {
      url: activeTab.url,
      title: pageMeta?.title || activeTab.title || '',
      description: pageMeta?.description || undefined,
      ogTitle: pageMeta?.ogTitle || undefined,
      ogDescription: pageMeta?.ogDescription || undefined,
      headings: pageMeta?.headings?.length ? pageMeta.headings : undefined,
      selectedText,
      source: 'extension',
      capturedFrom: 'brave-extension',
      project: getProject(),
      tags: parseTags(tagsInput.value),
      whySaved: whySavedInput.value.trim() || undefined,
    }

    const response = await fetch(INBOX_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Inbox request failed')
    }

    const result = await response.json()
    await savePreferences()

    if (result.status === 'duplicate') {
      setStatus('Already in inbox.', 'warn')
    } else {
      setStatus('Saved to inbox.', 'ok')
    }
  } catch {
    setStatus('Start Zunbreak Research Inbox first (npm run dev).', 'error')
  } finally {
    saveBtn.disabled = false
  }
})
