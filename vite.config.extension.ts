import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist/extension',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        inbox: resolve(rootDir, 'extension/inbox.html'),
        popup: resolve(rootDir, 'src/extension/popup.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'popup') return 'popup.js'
          if (chunk.name === 'inbox') return 'inbox.js'
          return 'chunks/[name]-[hash].js'
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
