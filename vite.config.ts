import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves a project site under /<repo>/, a custom domain serves it
// from the root. Relative paths suit both, and this site needs nothing more:
// one page, no client-side router. BASE_PATH stays available to force an
// absolute prefix.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_PATH ?? './',
  server: {
    // Respect a port imposed by the environment (preview, container, CI).
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
