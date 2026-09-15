import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileBackupPlugin } from './vite-plugin-file-backup.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), fileBackupPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
