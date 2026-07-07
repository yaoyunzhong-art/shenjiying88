import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * locale-router.e2e.test.ts - Phase-20 T45
 * 用途: Locale 路由 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: URL 前缀 → locale
 * - AC-2: X-Locale header (覆盖 URL 之外的请求)
 * - AC-3: Accept-Language 协商 (含 q 值)
 * - AC-4: 优先级: URL > X-Locale > Accept-Language > default
 * - AC-5: 语言族匹配 (en → en-US)
 * - AC-6: buildUrl 辅助
 */
import { I18nService } from './i18n.service';
import { LocaleRouterService } from './locale-router.service';

describe('LocaleRouterService · Phase-20 T45', () => {
  let i18n: I18nService;
  let router: LocaleRouterService;

  beforeEach(() => {
    i18n = new I18nService();
    router = new LocaleRouterService(i18n);
  });

  // AC-1: URL 前缀
  it('AC-1 URL prefix: /en-US/api/* → en-US', () => {
    expect(router.extractFromUrl('/en-US/api/orders')).toBe('en-US');
    expect(router.extractFromUrl('/ja-JP/dashboard')).toBe('ja-JP');
    expect(router.extractFromUrl('/zh-CN')).toBe('zh-CN');
    expect(router.extractFromUrl('/api/orders')).toBeNull(); // 无前缀
    expect(router.extractFromUrl('/en/api/orders')).toBeNull(); // 不是支持的 locale
  });

  // AC-2: X-Locale header
  it('AC-2 X-Locale header override', () => {
    const r = router.resolve('/api/orders', { 'x-locale': 'ja-JP' });
    expect(r.locale).toBe('ja-JP');
    expect(r.source).toBe('header-x-locale');
  });

  // AC-3: Accept-Language 协商
  it('AC-3 Accept-Language negotiation with q values', () => {
    // 精确匹配
    expect(router.parseAcceptLanguage('ja-JP,en-US;q=0.9,zh-CN;q=0.8')).toBe('ja-JP');
    // q 值排序
    expect(router.parseAcceptLanguage('en-US;q=0.7,zh-CN;q=0.9')).toBe('zh-CN');
    // 都不支持 → null
    expect(router.parseAcceptLanguage('fr-FR,de-DE')).toBeNull();
  });

  // AC-4: 优先级链
  it('AC-4 priority: URL > X-Locale > Accept-Language > default', () => {
    // URL 优先
    let r = router.resolve('/ja-JP/api/x', {
      'x-locale': 'en-US',
      'accept-language': 'zh-CN',
    });
    expect(r.locale).toBe('ja-JP');
    expect(r.source).toBe('url');

    // X-Locale 优先 (无 URL 前缀)
    r = router.resolve('/api/x', {
      'x-locale': 'en-US',
      'accept-language': 'ja-JP',
    });
    expect(r.locale).toBe('en-US');
    expect(r.source).toBe('header-x-locale');

    // Accept-Language 兜底
    r = router.resolve('/api/x', { 'accept-language': 'ja-JP,en-US;q=0.5' });
    expect(r.locale).toBe('ja-JP');
    expect(r.source).toBe('header-accept-language');

    // 默认
    r = router.resolve('/api/x', {});
    expect(r.locale).toBe('zh-CN');
    expect(r.source).toBe('default');
  });

  // AC-5: 语言族匹配
  it('AC-5 language family fallback: en → en-US, ja → ja-JP', () => {
    expect(router.parseAcceptLanguage('en')).toBe('en-US');
    expect(router.parseAcceptLanguage('ja')).toBe('ja-JP');
    expect(router.parseAcceptLanguage('zh')).toBe('zh-CN');
    // 精确匹配优先于语言族
    expect(router.parseAcceptLanguage('ja-JP,ja;q=0.5')).toBe('ja-JP');
  });

  // AC-6: buildUrl
  it('AC-6 buildUrl: locale-prefixed path', () => {
    expect(router.buildUrl('/api/orders', 'en-US')).toBe('/en-US/api/orders');
    expect(router.buildUrl('api/orders', 'ja-JP')).toBe('/ja-JP/api/orders');
    // 列出所有支持的 prefix
    const prefixes = router.listSupportedPrefixes();
    expect(prefixes.length).toBe(3);
    expect(prefixes.find((p) => p.locale === 'zh-CN')?.prefix).toBe('/zh-CN');
  });
});
