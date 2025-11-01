import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Correct base path for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/annotation-insight/',
})
