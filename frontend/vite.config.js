import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
    },
  },
  server: {
    watch: {
      // Use polling to avoid missing or duplicate file events when
      // working inside cloud-synced folders (OneDrive, Dropbox, etc.).
      usePolling: true,
      interval: 1000
    }
  },
})
