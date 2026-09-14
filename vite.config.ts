import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  /**
   * GitHub Pages serves a project site from /<repo>/, not from the domain root,
   * so the built asset URLs need that prefix. The deploy workflow sets it; a
   * local build stays at the root, where `npm run preview` expects it.
   */
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    // Honour a host-assigned port so the preview pane can find the server.
    port: Number(process.env.PORT) || 5173,
  },
})
