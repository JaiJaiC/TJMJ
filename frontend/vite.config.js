import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/TJMJ/'  // <--- 新增这一行（注意：必须要和你的 GitHub 仓库名一模一样，前后都有斜杠！）
})