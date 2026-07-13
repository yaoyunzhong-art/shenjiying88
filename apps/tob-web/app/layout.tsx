import type { Metadata } from 'next';
import { headers } from 'next/headers';
import React from 'react';
import {
  PORTAL_DOCUMENT_LANGUAGE_HEADER,
  sanitizeDocumentLanguage,
} from './lib/document-language';

export const metadata: Metadata = {
  title: 'Shenjiying - ToB Admin',
  description: 'ToB admin panel for alert & operation management',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const documentLanguage = sanitizeDocumentLanguage(
    requestHeaders.get(PORTAL_DOCUMENT_LANGUAGE_HEADER)
  );

  return (
    <html lang={documentLanguage}>
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
