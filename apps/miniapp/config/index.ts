import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: 'm5-miniapp',
  date: '2026-06-11',
  designWidth: 375,
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  mini: {},
  h5: {}
});
