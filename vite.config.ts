import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import vitePluginEslint from 'vite-plugin-eslint'
import vitePluginDts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vitePluginEslint({
      include: ['packages/**/*.ts', 'packages/**/*.vue', 'packages/**/*.js']
    }),
    vitePluginDts({
      entryRoot: "./packages",
      outDir: ["./dist/lib"],
      //指定使用的tsconfig.json为我们整个项目根目录下,如果不配置,你也可以在components下新建tsconfig.json
      tsconfigPath: "./tsconfig.buildts.json",
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "packages"),
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
