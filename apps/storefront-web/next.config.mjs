import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@m5/ui', '@m5/domain'],
  output: 'standalone',
  outputFileTracingRoot: path.join(currentDir, '../..'),
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: false
  },
  // ⚠️ 2026-07-20: 允许page.tsx导出interfaces/helpers（多个page.tsx需要重构到独立文件）
  // TODO: 将工具函数移出page.tsx到独立的analytics-data.ts等文件
  experimental: {
    strictNextPageExport: false
  }
};

export default nextConfig;
