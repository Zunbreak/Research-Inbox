import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceSvg = path.join(root, 'extension', 'brand', 'zunbreak-icon.svg')
const outDir = path.join(root, 'extension', 'icons')
const sizes = [16, 32, 48, 128]

if (!fs.existsSync(sourceSvg)) {
  console.error(`Missing source icon: ${sourceSvg}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
const svg = fs.readFileSync(sourceSvg)

for (const size of sizes) {
  const outPath = path.join(outDir, `icon${size}.png`)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(outPath)
  console.log(`Wrote ${path.relative(root, outPath)}`)
}
