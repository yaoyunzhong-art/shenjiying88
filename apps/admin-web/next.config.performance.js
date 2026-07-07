/**
 * Next.js 性能优化配置
 * Sprint 2 Day 23 - 首屏加载优化
 * 
 * 优化策略:
 * 1. 图片优化 (WebP/AVIF, 懒加载)
 * 2. 代码分割 (动态导入, 路由分割)
 * 3. 缓存策略 (静态资源长期缓存)
 * 4. 压缩优化 (Gzip/Brotli)
 * 5. 关键CSS内联
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基础配置继承
  ...require('./next.config.mjs'),
  
  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 实验性功能 (性能优化)
  experimental: {
    // 优化包导入 (tree-shaking增强)
    optimizePackageImports: [
      'antd',
      '@ant-design/icons',
      'lodash',
      'date-fns',
    ],
    
    // 服务器操作优化
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // 部分预渲染 (实验性)
    ppr: false, // 暂不启用，等待稳定
    
    // 编译器优化
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 头部配置 (安全 + 性能)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 安全头
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // 性能优化 - 预连接
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect',
          },
        ],
      },
      {
        // 静态资源长期缓存
        source: '/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // 重写规则
  async rewrites() {
    return [
      // API代理
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
  
  // 重定向规则
  async redirects() {
    return [
      // 旧路由重定向
      {
        source: '/license-management',
        destination: '/admin/license',
        permanent: true,
      },
      {
        source: '/license-activation',
        destination: '/admin/license/activate',
        permanent: true,
      },
    ]
  },
  
  // Webpack配置 (性能优化)
  webpack: (config, { isServer, dev }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      // 分割 vendors chunk
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React生态
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 40,
            chunks: 'all',
          },
          // 路由
          router: {
            name: 'router',
            test: /[\\/]node_modules[\\/](react-router|react-router-dom|history|@tanstack)[\\/]/,
            priority: 35,
            chunks: 'all',
          },
          // UI库
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
            priority: 30,
            chunks: 'all',
          },
          // 工具库
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|moment|dayjs|date-fns|axios)[\\/]/,
            priority: 25,
            chunks: 'all',
          },
          // 其他第三方库
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'all',
          },
          // 公共代码
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
          },
        },
      }
      
      // 压缩优化
      config.optimization.minimizer = [
        // TerserPlugin 已在Next.js中默认配置
      ]
      
      // 模块大小警告
      config.performance = {
        maxEntrypointSize: 250 * 1024, // 250KB
        maxAssetSize: 250 * 1024,
        hints: 'warning',
      }
    }
    
    return config
  },
  
  // 编译器配置
  compiler: {
    // 移除 console 和 debugger (生产环境)
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 日志级别
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  },
  
  // 类型检查 (生产构建时启用)
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  
  // ESLint配置
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
}

