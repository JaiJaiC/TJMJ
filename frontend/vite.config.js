import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 必须加上这个斜杠！明确告诉浏览器所有 JS 和 CSS 都在 /TJMJ/ 目录下找！
  base: '/TJMJ/'
})