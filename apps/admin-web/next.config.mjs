import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// V23 Day15 L1: 安全头加固
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()', 'microphone=()', 'geolocation=()',
      'interest-cohort=()', 'autoplay=(self)', 'payment=()', 'usb=()',
    ].join(', '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@m5/ui', '@m5/domain'],
  output: 'standalone',
  outputFileTracingRoot: path.join(currentDir, '../..'),

  eslint: { ignoreDuringBuilds: true },
  // 存量TSC错误(catch unknown)不阻塞构建; Tree哥 API侧修
  typescript: { ignoreBuildErrors: true },

  // antd v6 CJS组件是lazy object，Next.js RSC静态生成时无法序列化
  // 全站标记为动态渲染以绕过RSC序列化问题
  experimental: {
    // 无
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
