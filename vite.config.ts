import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import vitePluginEslint from 'vite-plugin-eslint'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vitePluginEslint({
      include: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.js']
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "examples"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'packages/index.ts'),
      name: 'VueLabel',
      // 将添加适当的扩展名后缀
      fileName: 'vue3-label',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
