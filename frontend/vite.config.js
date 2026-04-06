import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './'   // <--- 加上这一行神仙代码，意思是“就在当前文件夹找东西”，专治各种白屏 404！
})