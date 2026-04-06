import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 【最关键的一行】加上这个相对路径，打包后的文件就永远不会迷路了！
  base: './'
})