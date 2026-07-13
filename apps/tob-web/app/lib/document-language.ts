const DEFAULT_DOCUMENT_LANGUAGE = 'zh-CN';

const MARKET_DOCUMENT_LANGUAGE_MAP: Record<string, string> = {
  'cn-mainland': 'zh-CN',
  'us-default': 'en-US',
  'sea-sg': 'en-SG',
  'jp-tokyo': 'ja-JP',
  'eu-de': 'de-DE',
};

export const PORTAL_DOCUMENT_LANGUAGE_HEADER = 'x-market-locale';

export function resolveDocumentLanguageFromPathname(pathname?: string | null): string {
  if (!pathname) {
    return DEFAULT_DOCUMENT_LANGUAGE;
  }

  const marketCode = pathname
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('?')[0]
    ?.split('#')[0]
    ?.split('/')
    .filter(Boolean)[0];

  if (!marketCode) {
    return DEFAULT_DOCUMENT_LANGUAGE;
  }

  return MARKET_DOCUMENT_LANGUAGE_MAP[marketCode] ?? DEFAULT_DOCUMENT_LANGUAGE;
}

export function sanitizeDocumentLanguage(language?: string | null): string {
  if (!language) {
    return DEFAULT_DOCUMENT_LANGUAGE;
  }

  return Object.values(MARKET_DOCUMENT_LANGUAGE_MAP).includes(language)
    ? language
    : DEFAULT_DOCUMENT_LANGUAGE;
}
