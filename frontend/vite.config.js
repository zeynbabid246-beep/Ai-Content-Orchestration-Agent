import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Use polling to avoid missing or duplicate file events when
      // working inside cloud-synced folders (OneDrive, Dropbox, etc.).
      usePolling: true,
      interval: 1000
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  }
})
