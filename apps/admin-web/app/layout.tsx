import type { Metadata, Viewport } from 'next';
import './globals.css';

// P-49 SEO/GEO 优化: 基础 Metadata 配置
export const metadata: Metadata = {
  // 基础 SEO
  title: {
    default: '神机营体育 - 数字运动潮玩平台',
    template: '%s | 神机营体育',
  },
  description: '神机营体育是领先的数字运动潮玩平台，提供全渠道零售解决方案，覆盖门店管理、库存物流、会员营销、数据分析等核心业务。',
  keywords: ['体育零售', '数字运动', '潮玩平台', '门店管理', '库存物流', '会员营销', 'SaaS'],
  
  // 作者和版权
  authors: [{ name: '神机营体育', url: 'https://shenjiying.com' }],
  creator: '神机营体育',
  publisher: '神机营体育',
  
  // 搜索引擎配置
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph (Facebook, LinkedIn, 等)
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: ['en_US'],
    url: 'https://admin.shenjiying.com',
    siteName: '神机营体育',
    title: '神机营体育 - 数字运动潮玩平台',
    description: '领先的数字运动潮玩平台，提供全渠道零售解决方案',
    images: [
      {
        url: 'https://assets.shenjiying.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '神机营体育平台预览',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@shenjiying',
    creator: '@shenjiying',
    title: '神机营体育 - 数字运动潮玩平台',
    description: '领先的数字运动潮玩平台，提供全渠道零售解决方案',
    images: ['https://assets.shenjiying.com/twitter-card.png'],
  },
  
  // 网站验证 (需要替换为实际验证代码)
  verification: {
    google: 'google-site-verification-code',
    baidu: 'baidu-site-verification-code',
  },
  
  // 分类和评分
  category: 'business',
  
  // 其他重要元数据
  metadataBase: new URL('https://admin.shenjiying.com'),
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/zh',
      'en-US': '/en',
    },
  },
  
  // P-49 GEO 优化: 地理定位元数据
  other: {
    'geo.region': 'CN-11',
    'geo.placename': '北京',
    'geo.position': '39.9042;116.4074',
    'ICBM': '39.9042, 116.4074',
  },
};

// P-49 SEO 优化: Viewport 配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      {/* P-49 SEO: 结构化数据 (JSON-LD) */}
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '神机营体育',
              alternateName: 'Shenjiying Sports',
              url: 'https://shenjiying.com',
              logo: 'https://assets.shenjiying.com/logo.png',
              sameAs: [
                'https://weibo.com/shenjiying',
                'https://www.linkedin.com/company/shenjiying',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+86-400-888-8888',
                contactType: 'customer service',
                availableLanguage: ['Chinese', 'English'],
              },
              // P-49 GEO: 组织地址信息
              address: {
                '@type': 'PostalAddress',
                streetAddress: '朝阳区建国路88号',
                addressLocality: '北京',
                addressRegion: '北京市',
                postalCode: '100022',
                addressCountry: 'CN',
              },
              // P-49 GEO: 地理位置坐标
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 39.9042,
                longitude: 116.4074,
              },
            }),
          }}
        />
        {/* P-49 SEO: 额外的 GEO 元数据 */}
        <meta name="geo.region" content="CN-11" />
        <meta name="geo.placename" content="北京" />
        <meta name="geo.position" content="39.9042;116.4074" />
        <meta name="ICBM" content="39.9042, 116.4074" />
      </head>
      <body>{children}</body>
    </html>
  );
}
