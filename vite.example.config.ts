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
      include: ['examples/**/*.ts', 'examples/**/*.vue', 'examples/**/*.js']
    }),
    vitePluginDts({
      entryRoot: "./examples",
      outDir: ["./examples-dist"],
      tsconfigPath: "./tsconfig.buildts.json",
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "examples"),
    },
  },
  build: {
    rollupOptions: {
      // external: ['vue'],
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        format: 'esm',
        dir: './examples-dist',
        esModule: true,
        // globals: {
        //   vue: 'Vue',
        // },
      },
    },
  },
})
