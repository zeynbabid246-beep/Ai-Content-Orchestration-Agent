import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Use polling to avoid missing or duplicate file events when
      // working inside cloud-synced folders (OneDrive, Dropbox, etc.).
      usePolling: true,
      interval: 1000
    }
  },
})
