import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The icons, and the manifest that points at them. Browsers cache favicons
 * harder than anything else on a page — often past the headers — so the links
 * carry a version query. It is derived from the bytes rather than typed by
 * hand: a number you have to remember to bump is a number that will be wrong
 * exactly when it matters, which is the moment the icon changes.
 */
const ICON_FILES = [
  'public/favicon.svg',
  'public/favicon-32.png',
  'public/apple-touch-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-512.png',
  'public/site.webmanifest',
]

function iconVersion(): string {
  const hash = createHash('sha256')
  for (const file of ICON_FILES) {
    try {
      hash.update(readFileSync(file))
    } catch {
      // A missing icon should not stop a build; it just does not colour the hash.
    }
  }
  return hash.digest('hex').slice(0, 8)
}

/**
 * Replaces %ICON_V% in index.html, in dev and in the build alike.
 *
 * `enforce: 'pre'` is load-bearing. Vite rewrites root-relative asset URLs in
 * the HTML to sit under `base`, and it will not touch an href whose query still
 * holds an unresolved placeholder — so running after it silently left the icons
 * pointing at the domain root, which 404s on a project site.
 */
function iconVersionPlugin() {
  return {
    name: 'icon-version',
    enforce: 'pre' as const,
    transformIndexHtml: {
      order: 'pre' as const,
      handler: (html: string) => html.replaceAll('%ICON_V%', iconVersion()),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  /**
   * GitHub Pages serves a project site from /<repo>/, not from the domain root,
   * so the built asset URLs need that prefix. The deploy workflow sets it; a
   * local build stays at the root, where `npm run preview` expects it.
   */
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), iconVersionPlugin()],
  server: {
    // Honour a host-assigned port so the preview pane can find the server.
    port: Number(process.env.PORT) || 5173,
  },
})
