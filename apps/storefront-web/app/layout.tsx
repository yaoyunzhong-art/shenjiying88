import type { Metadata } from 'next';
import React from 'react';

// antd v6 CJS components are lazy objects — bypass RSC static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    template: '%s | 神机营体育',
    default: '神机营体育 · 数字运动潮玩空间',
  },
  description: '神机营体育 — 全国领先的数字运动潮玩连锁品牌。电竞体验、VR对战、亲子运动、团建派对，即刻预约！',
  keywords: ['电竞', 'VR', '亲子运动', '团建', '数字运动', '潮玩', '神机营'],
  authors: [{ name: 'Shenjiying' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '神机营体育',
    title: '神机营体育 · 数字运动潮玩空间',
    description: '全国领先的数字运动潮玩连锁品牌。即刻预约体验！',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
