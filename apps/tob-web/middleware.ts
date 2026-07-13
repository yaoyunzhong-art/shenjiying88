import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  PORTAL_DOCUMENT_LANGUAGE_HEADER,
  resolveDocumentLanguageFromPathname,
} from './app/lib/document-language';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    PORTAL_DOCUMENT_LANGUAGE_HEADER,
    resolveDocumentLanguageFromPathname(request.nextUrl.pathname)
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
