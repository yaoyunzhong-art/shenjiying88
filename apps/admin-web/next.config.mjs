import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// V23 Day15 L1: 安全头加固
const securityHeaders = [
  // 1. 点击劫持防护
  { key: 'X-Frame-Options', value: 'DENY' },

  // 2. MIME 类型嗅探防护
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // 3. DNS 预取控制
  { key: 'X-DNS-Prefetch-Control', value: 'on' },

  // 4. HSTS (仅HTTPS，2年有效期)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // 5. 引荐策略
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // 6. CSP (内容安全策略)
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

  // 7. Permissions-Policy (限制浏览器特性使用)
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'autoplay=(self)',
      'payment=()',
      'usb=()',
    ].join(', '),
  },
];

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
  experimental: {
    workerThreads: false,
  },
  webpack: (config) => {
    // Ensure CJS packages in transpilePackages get proper ESM interop
    config.module.rules.push({
      test: /node_modules\/@m5\/(ui|domain)\/dist\/index\.js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },

  // V23 Day15 L1: 安全响应头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
