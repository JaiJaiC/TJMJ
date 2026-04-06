import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/TJMJ/'  // <--- 必须是这个！专门适配你的 GitHub Pages 路径
})