import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { addCapturedLink, sortLinksByCapturedAt } from './src/lib/capture.ts'
import {
  LIMITS,
  PayloadTooLargeError,
  parseBackupPayload,
  parseBackupPayloadLenient,
  parseCaptureLinkInput,
} from './src/lib/validation.ts'
import type { BackupPayload } from './src/types.ts'

const BACKUP_DIR = 'data'
const BACKUP_FILE = 'links.json'

function backupPath(root: string): string {
  return path.join(root, BACKUP_DIR, BACKUP_FILE)
}

function readBackup(root: string): BackupPayload {
  const filePath = backupPath(root)
  if (!fs.existsSync(filePath)) {
    return { version: 1, savedAt: null, links: [], recentProjects: [] }
  }

  const parsed = parseBackupPayloadLenient(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
  return parsed
}

function writeBackup(root: string, payload: BackupPayload): string {
  const filePath = backupPath(root)
  const savedAt = new Date().toISOString()
  const next: BackupPayload = { ...payload, savedAt }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf-8')
  return savedAt
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  return (
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  )
}

function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin!)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  return req.method === 'OPTIONS'
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        req.destroy()
        reject(new PayloadTooLargeError(maxBytes))
        return
      }
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function handleBackupRequest(
  root: string,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (applyCors(req, res)) {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === 'GET') {
    try {
      sendJson(res, 200, readBackup(root))
    } catch {
      sendJson(res, 500, { error: 'Failed to read backup' })
    }
    return
  }

  if (req.method === 'POST') {
    void readBody(req, LIMITS.backupBodyBytes)
      .then((body) => {
        let parsed: unknown
        try {
          parsed = JSON.parse(body)
        } catch {
          sendJson(res, 400, { error: 'Invalid JSON' })
          return
        }

        const validated = parseBackupPayload(parsed)
        if (!validated.ok) {
          sendJson(res, 400, { error: validated.error })
          return
        }

        const savedAt = writeBackup(root, validated.value)
        sendJson(res, 200, { ok: true, savedAt })
      })
      .catch((error: unknown) => {
        if (error instanceof PayloadTooLargeError) {
          sendJson(res, 413, { error: 'Payload too large' })
          return
        }
        sendJson(res, 400, { error: 'Invalid request' })
      })
    return
  }

  next()
}

function handleCaptureLinkRequest(
  root: string,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (applyCors(req, res)) {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    next()
    return
  }

  void readBody(req, LIMITS.captureBodyBytes)
    .then((body) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(body)
      } catch {
        sendJson(res, 400, { success: false, status: 'invalid', message: 'Invalid JSON' })
        return
      }

      const validated = parseCaptureLinkInput(parsed)
      if (!validated.ok) {
        sendJson(res, 400, {
          success: false,
          status: 'invalid',
          message: validated.error,
        })
        return
      }

      const input = validated.value
      const backup = readBackup(root)
      const { links, result } = addCapturedLink(backup.links, {
        ...input,
        source: input.source ?? 'extension',
      })

      if (result.status === 'created') {
        writeBackup(root, {
          ...backup,
          links: sortLinksByCapturedAt(links),
        })
      }

      sendJson(res, 200, {
        success: result.success,
        status: result.status,
        id: result.id,
        message: result.message,
      })
    })
    .catch((error: unknown) => {
      if (error instanceof PayloadTooLargeError) {
        sendJson(res, 413, {
          success: false,
          status: 'invalid',
          message: 'Payload too large',
        })
        return
      }
      sendJson(res, 400, { success: false, status: 'invalid', message: 'Invalid payload' })
    })
}

export function fileBackupPlugin(): Plugin {
  return {
    name: 'file-backup',
    configureServer(server) {
      const root = server.config.root
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/backup') {
          handleBackupRequest(root, req, res, next)
          return
        }
        if (url === '/api/capture-link') {
          handleCaptureLinkRequest(root, req, res, next)
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      const root = server.config.root
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/backup') {
          handleBackupRequest(root, req, res, next)
          return
        }
        if (url === '/api/capture-link') {
          handleCaptureLinkRequest(root, req, res, next)
          return
        }
        next()
      })
    },
  }
}
