import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Shenjiying - ToB Admin',
  description: 'ToB admin panel for alert & operation management',
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
