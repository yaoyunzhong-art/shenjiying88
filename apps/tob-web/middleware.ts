import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  PORTAL_DOCUMENT_LANGUAGE_HEADER,
  resolveDocumentLanguageFromPathname,
} from './app/lib/document-language';

// V23 Day15 L1: 安全头加固（middleware防御层）
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
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
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'autoplay=(self)',
    'payment=()',
    'usb=()',
  ].join(', '),
};

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    PORTAL_DOCUMENT_LANGUAGE_HEADER,
    resolveDocumentLanguageFromPathname(request.nextUrl.pathname)
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // V23 Day15 L1: 注入安全响应头
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
