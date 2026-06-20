import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcssCustomMedia from 'postcss-custom-media'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [
        postcssCustomMedia({
          // 项目中已用 @custom-media 声明的别名会自动被解析
        }),
      ],
    },
  },
})
