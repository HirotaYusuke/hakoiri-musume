import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はリポジトリ名のサブパスで配信されるため、本番のみ base を切り替える
  base: process.env.GITHUB_PAGES === 'true' ? '/hakoiri-musume/' : '/',
  plugins: [react()],
})
