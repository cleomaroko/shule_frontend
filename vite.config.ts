import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // The Spring Boot backend registers no CORS configuration, so browser requests
  // straight to :8080 are rejected. Proxying same-origin keeps local dev working
  // without modifying the backend.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080'
  const apiProxy = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    // `preview` does not inherit `server.proxy`, so it is repeated here to let the
    // production build be smoke-tested against a local backend.
    preview: {
      port: 4173,
      proxy: apiProxy,
    },
    build: {
      // Split rarely-changing dependencies from application code so that shipping
      // a UI change does not invalidate the whole cached bundle.
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              { name: 'vendor', test: /node_modules/ },
            ],
          },
        },
      },
    },
  }
})
