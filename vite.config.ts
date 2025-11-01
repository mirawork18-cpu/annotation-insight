import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Correct GitHub Pages base path
export default defineConfig({
  plugins: [react()],
  base: '/annotation-insight/',
  build: {
    outDir: 'dist',
  },
})
