import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // extension dist 안의 webview 폴더로 출력 — panelManager가 여기서 로드
    outDir: path.resolve(__dirname, '../extension/dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      output: { entryFileNames: 'webview.js', assetFileNames: 'webview.[ext]' },
    },
  },
})
