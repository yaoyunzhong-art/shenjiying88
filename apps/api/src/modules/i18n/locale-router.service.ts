/**
 * locale-router.service.ts - Phase-20 T45
 * 用途: Locale 路由 + Accept-Language 协商
 * 关联: phase-20-compliance/spec.md §Phase 3
 *
 * 路由策略:
 * - URL 前缀: /en-US/api/* /ja-JP/api/* → 强制 locale
 * - 默认: /api/* → zh-CN (或 X-Locale header)
 * - Accept-Language header 协商
 * - 优先级: URL 前缀 > X-Locale header > Accept-Language > 默认
 */
import { Injectable, Logger } from '@nestjs/common';
import { I18nService, Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n.service';

export interface LocaleResolution {
  locale: Locale;
  source: 'url' | 'header-x-locale' | 'header-accept-language' | 'default';
  /** 候选优先级链 (用于诊断) */
  candidates: Locale[];
}

@Injectable()
export class LocaleRouterService {
  private readonly logger = new Logger(LocaleRouterService.name);
  /** URL 前缀 → locale 映射 */
  private readonly URL_PREFIX_MAP: Record<string, Locale> = {
    '/zh-CN': 'zh-CN',
    '/en-US': 'en-US',
    '/ja-JP': 'ja-JP',
  };

  constructor(private readonly i18n: I18nService) {}

  /**
   * 从 URL 提取 locale
   * @returns Locale 或 null
   */
  extractFromUrl(url: string): Locale | null {
    for (const [prefix, locale] of Object.entries(this.URL_PREFIX_MAP)) {
      if (url.startsWith(prefix + '/') || url === prefix) {
        return locale;
      }
    }
    return null;
  }

  /**
   * 从 Accept-Language header 解析 (RFC 7231)
   * 支持 q 值优先级: 'zh-CN,en-US;q=0.9,ja-JP;q=0.8'
   */
  parseAcceptLanguage(header: string | undefined): Locale | null {
    if (!header) return null;
    const candidates: Array<{ tag: string; q: number }> = [];
    for (const part of header.split(',')) {
      const trimmed = part.trim();
      const [tag, ...params] = trimmed.split(';').map((s) => s.trim());
      let q = 1;
      for (const p of params) {
        const match = p.match(/^q=([\d.]+)$/);
        if (match) q = parseFloat(match[1]);
      }
      candidates.push({ tag, q });
    }
    // 按 q 值降序
    candidates.sort((a, b) => b.q - a.q);

    for (const { tag } of candidates) {
      // 精确匹配 'zh-CN'
      if (SUPPORTED_LOCALES.includes(tag as Locale)) {
        return tag as Locale;
      }
      // 语言族匹配: 'en' → 'en-US'
      const lang = tag.split('-')[0].toLowerCase();
      const fallback: Record<string, Locale> = {
        zh: 'zh-CN',
        en: 'en-US',
        ja: 'ja-JP',
      };
      if (fallback[lang]) return fallback[lang];
    }
    return null;
  }

  /**
   * 解析请求 → 最终 locale
   * @param url 请求 URL (e.g. '/en-US/api/orders')
   * @param headers 请求头 { 'x-locale'?, 'accept-language'? }
   */
  resolve(url: string, headers: Record<string, string | undefined> = {}): LocaleResolution {
    const candidates: Locale[] = [];

    // 1. URL 前缀 (最高优先级)
    const fromUrl = this.extractFromUrl(url);
    if (fromUrl) {
      candidates.push(fromUrl);
      return { locale: fromUrl, source: 'url', candidates };
    }

    // 2. X-Locale header
    const xLocale = headers['x-locale'] || headers['X-Locale'];
    if (xLocale && SUPPORTED_LOCALES.includes(xLocale as Locale)) {
      candidates.push(xLocale as Locale);
      return { locale: xLocale as Locale, source: 'header-x-locale', candidates };
    }

    // 3. Accept-Language header
    const acceptLang = headers['accept-language'] || headers['Accept-Language'];
    const fromAccept = this.parseAcceptLanguage(acceptLang);
    if (fromAccept) {
      candidates.push(fromAccept);
      return { locale: fromAccept, source: 'header-accept-language', candidates };
    }

    // 4. 默认
    candidates.push(DEFAULT_LOCALE);
    return { locale: DEFAULT_LOCALE, source: 'default', candidates };
  }

  /**
   * 辅助:生成带 locale 前缀的 URL
   */
  buildUrl(path: string, locale: Locale): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${cleanPath}`;
  }

  /**
   * 列出所有支持的 URL 前缀
   */
  listSupportedPrefixes(): Array<{ prefix: string; locale: Locale }> {
    return Object.entries(this.URL_PREFIX_MAP).map(([prefix, locale]) => ({ prefix, locale }));
  }
}