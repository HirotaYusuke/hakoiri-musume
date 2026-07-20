import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Cloudflare Workers のルート配信のため base は '/'。
export default defineConfig({
  base: '/',
  plugins: [react()],
})
