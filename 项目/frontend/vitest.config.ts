/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'element-plus/es': path.resolve(__dirname, 'node_modules/element-plus/es'),
      'element-plus': path.resolve(__dirname, 'node_modules/element-plus')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    transformMode: {
      web: [/.[tj]sx$/]
    },
    setupFiles: [],
    coverage: {
      provider: 'v8'
    }
  }
})