import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://chloeinocencio.github.io/WhereTwo/
  base: '/WhereTwo/',
  plugins: [react(), tailwindcss()],
})
