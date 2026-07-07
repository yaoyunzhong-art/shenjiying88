import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { flowStripPlugin } from './scripts/vitest-flow-strip'

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    server: {
      deps: {
        inline: [/react-native/],
      },
    },
  },
  plugins: [flowStripPlugin()],
  resolve: {
    alias: {
      // Mock react-native and related modules to avoid Flow syntax parsing by rolldown
      'react-native': path.resolve(__dirname, '__mocks__/react-native/index.js'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, '__mocks__/@react-native-async-storage/async-storage/index.js'),
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@navigation': path.resolve(__dirname, './src/navigation'),
      '@store': path.resolve(__dirname, './src/store'),
      '@network': path.resolve(__dirname, './src/network'),
      '@db': path.resolve(__dirname, './src/db'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
