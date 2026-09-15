import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist', 'extension')

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

function copyDirIfExists(from, to) {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDirIfExists(src, dest)
    } else {
      fs.copyFileSync(src, dest)
    }
  }
}

copyIfExists(path.join(root, 'extension', 'manifest.prod.json'), path.join(outDir, 'manifest.json'))
copyIfExists(path.join(root, 'extension', 'popup.css'), path.join(outDir, 'popup.css'))
copyDirIfExists(path.join(root, 'extension', 'icons'), path.join(outDir, 'icons'))

function fixExtensionAssetPaths(html) {
  return html
    .replace(/\/src\/extension\/inbox-main\.tsx/g, './inbox.js')
    .replace(/\.\.\/inbox\.js/g, './inbox.js')
    .replace(/\.\.\/chunks\//g, './chunks/')
    .replace(/\.\.\/assets\//g, './assets/')
}

const nestedInboxHtml = path.join(outDir, 'extension', 'inbox.html')
const rootInboxHtml = path.join(outDir, 'inbox.html')
const inboxHtmlPath = fs.existsSync(nestedInboxHtml) ? nestedInboxHtml : rootInboxHtml
const inboxJsPath = path.join(outDir, 'inbox.js')

if (fs.existsSync(inboxHtmlPath)) {
  let html = fixExtensionAssetPaths(fs.readFileSync(inboxHtmlPath, 'utf-8'))
  if (!html.includes('./inbox.js')) {
    html = html.replace('</body>', '    <script type="module" src="./inbox.js"></script>\n  </body>')
  }
  fs.writeFileSync(path.join(outDir, 'inbox.html'), html)
  if (fs.existsSync(nestedInboxHtml)) {
    fs.rmSync(path.join(outDir, 'extension'), { recursive: true, force: true })
  }
}

const popupHtmlSrc = path.join(root, 'extension', 'popup.html')
let popupHtml = fs.readFileSync(popupHtmlSrc, 'utf-8')
popupHtml = popupHtml.replace('<script src="popup.js"></script>', '<script type="module" src="popup.js"></script>')
fs.writeFileSync(path.join(outDir, 'popup.html'), popupHtml)

if (!fs.existsSync(inboxJsPath)) {
  console.error('Expected inbox.js in dist/extension — run vite build first')
  process.exit(1)
}

console.log('Assembled standalone extension in dist/extension/')
