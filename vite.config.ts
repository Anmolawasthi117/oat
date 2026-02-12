import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      // Fix Firebase popup auth COOP warnings
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
