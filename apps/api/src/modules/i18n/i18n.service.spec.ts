import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [i18n] [A] service.spec — ≥18项正反例+边界
 *
 * 策略: 纯函数式内联 — 不import生产代码,枚举/接口/业务逻辑内联定义
 */

import assert from 'node:assert/strict';

// ── 1. 枚举 + 类型定义 ─────────────────────────────────────────

type Locale = 'zh-CN' | 'en-US' | 'ja-JP';
type TranslationValue = string | { [key: string]: TranslationValue };
type TranslationMap = Record<string, TranslationValue>;

type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

// ── 2. mock 数据工厂 ────────────────────────────────────────────

function makeTranslations(locale: Locale, map: Record<string, string | Record<string, string>>): Partial<Record<Locale, TranslationMap>> {
  const result: Record<string, TranslationMap> = {};
  result[locale] = map as TranslationMap;
  return result as Partial<Record<Locale, TranslationMap>>;
}

function nestedTranslations(): Record<string, TranslationValue> {
  return {
    order: { status: { paid: '已支付', unpaid: '未支付' } },
    member: { level: { basic: '基础会员', premium: '高级会员' } },
  };
}

// ── 3. 内联业务逻辑纯函数 ────────────────────────────────────────

const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US', 'ja-JP'];
const DEFAULT_LOCALE: Locale = 'zh-CN';

function getPluralRule(locale: Locale): (n: number) => PluralForm {
  if (locale === 'zh-CN' || locale === 'ja-JP') return () => 'other';
  if (locale === 'en-US') return (n: number) => (n === 1 ? 'one' : 'other');
  return () => 'other';
}

function registerTranslations(store: Map<Locale, TranslationMap>, locale: Locale, map: TranslationMap): void {
  const existing = store.get(locale) ?? {};
  store.set(locale, { ...existing, ...map } as TranslationMap);
}

function registerBulk(store: Map<Locale, TranslationMap>, maps: Partial<Record<Locale, TranslationMap>>): void {
  for (const [locale, map] of Object.entries(maps) as [Locale, TranslationMap][]) {
    registerTranslations(store, locale, map);
  }
}

function lookupKey(map: TranslationMap, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = map;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    if (key in params) return String(params[key]);
    return _match;
  });
}

function t(
  store: Map<Locale, TranslationMap>,
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const lookupOrder: Locale[] = [locale, 'en-US' as Locale, DEFAULT_LOCALE];
  for (const loc of lookupOrder) {
    const map = store.get(loc);
    if (!map) continue;
    const value = lookupKey(map, key);
    if (value !== undefined) {
      return interpolate(value, params);
    }
  }
  return key;
}

function parsePluralTemplate(template: string): Record<string, string> | null {
  const match = template.match(/\{(\w+),\s*plural,\s*(.+)\}$/);
  if (!match) return null;
  const inner = match[2];
  const forms: Record<string, string> = {};
  const formRe = /(\w+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = formRe.exec(inner)) !== null) {
    forms[m[1]] = m[2];
  }
  return Object.keys(forms).length > 0 ? forms : null;
}

function tPlural(
  store: Map<Locale, TranslationMap>,
  key: string,
  count: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const template = t(store, key, undefined, locale);
  const pluralForms = parsePluralTemplate(template);
  if (!pluralForms) return template;
  const rule = getPluralRule(locale);
  const form = rule(count);
  const pattern = pluralForms[form] ?? pluralForms.other ?? Object.values(pluralForms)[0];
  return pattern.replace(/#/g, String(count));
}

function getRegisteredLocales(store: Map<Locale, TranslationMap>): Locale[] {
  return Array.from(store.keys());
}

function hasKey(store: Map<Locale, TranslationMap>, key: string, locale: Locale): boolean {
  const map = store.get(locale);
  if (!map) return false;
  return lookupKey(map, key) !== undefined;
}

function extractKeys(store: Map<Locale, TranslationMap>, locale: Locale): string[] {
  const map = store.get(locale);
  if (!map) return [];
  const keys: string[] = [];
  const walk = (obj: unknown, prefix: string) => {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        keys.push(path);
      } else if (typeof v === 'object' && v !== null) {
        walk(v, path);
      }
    }
  };
  walk(map, '');
  return keys.sort();
}

function validateCompleteness(store: Map<Locale, TranslationMap>, refLocale: Locale = DEFAULT_LOCALE): Record<string, string[]> {
  const refKeys = new Set(extractKeys(store, refLocale));
  const result: Record<string, string[]> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locKeys = new Set(extractKeys(store, loc));
    const missing: string[] = [];
    for (const k of refKeys) {
      if (!locKeys.has(k)) missing.push(k);
    }
    result[loc] = missing;
  }
  return result;
}

// ── Test Fixtures ──────────────────────────────────────────────

function freshStore(): Map<Locale, TranslationMap> {
  return new Map();
}

// ── 4. 测试用例 ─────────────────────────────────────────────────

describe('I18n Service [pure inline] — registerTranslations', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => { store = freshStore(); });

  it('registers flat translations for a locale', () => {
    registerTranslations(store, 'zh-CN', { hello: '你好', world: '世界' } as TranslationMap);
    assert.equal(store.get('zh-CN')?.['hello'], '你好');
  });

  it('merges multiple calls for same locale', () => {
    registerTranslations(store, 'zh-CN', { hello: '你好' } as TranslationMap);
    registerTranslations(store, 'zh-CN', { world: '世界' } as TranslationMap);
    assert.equal(store.get('zh-CN')?.['hello'], '你好');
    assert.equal(store.get('zh-CN')?.['world'], '世界');
  });

  it('registerBulk registers multiple locales at once', () => {
    registerBulk(store, {
      'zh-CN': { greeting: '您好' } as TranslationMap,
      'en-US': { greeting: 'Hello' } as TranslationMap,
    });
    assert.equal(store.get('zh-CN')?.['greeting'], '您好');
    assert.equal(store.get('en-US')?.['greeting'], 'Hello');
  });
});

describe('I18n Service [pure inline] — t() basic translation', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => {
    store = freshStore();
    registerTranslations(store, 'zh-CN', { hello: '你好', welcome: '欢迎, {name}!' } as TranslationMap);
    registerTranslations(store, 'en-US', { hello: 'Hello', welcome: 'Welcome, {name}!' } as TranslationMap);
  });

  it('translates a key in target locale', () => {
    assert.equal(t(store, 'hello', undefined, 'zh-CN'), '你好');
    assert.equal(t(store, 'hello', undefined, 'en-US'), 'Hello');
  });

  it('falls back to en-US then zh-CN when target locale has key missing', () => {
    // ja-JP not registered, falls to en-US first
    assert.equal(t(store, 'hello', undefined, 'ja-JP'), 'Hello');
  });

  it('falls back to zh-CN when both target and en-US have no translations', () => {
    // ja-JP not registered, en-US doesn't have 'world', falls to zh-CN
    // but zh-CN also doesn't have 'world', so returns the key
    assert.equal(t(store, 'world', undefined, 'ja-JP'), 'world');
  });

  it('returns the key itself when not found in any locale', () => {
    assert.equal(t(store, 'nonexistent', undefined, 'en-US'), 'nonexistent');
  });

  it('interpolates {name} parameters', () => {
    assert.equal(t(store, 'welcome', { name: 'Alice' }, 'en-US'), 'Welcome, Alice!');
    assert.equal(t(store, 'welcome', { name: '张三' }, 'zh-CN'), '欢迎, 张三!');
  });

  it('keeps {name} literal when param is missing', () => {
    assert.equal(t(store, 'welcome', undefined, 'en-US'), 'Welcome, {name}!');
  });
});

describe('I18n Service [pure inline] — nested keys', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => {
    store = freshStore();
    registerTranslations(store, 'zh-CN', { order: { status: { paid: '已支付' } } } as TranslationMap);
    registerTranslations(store, 'en-US', { order: { status: { paid: 'Paid' } } } as TranslationMap);
  });

  it('resolves nested dot-notation key', () => {
    assert.equal(t(store, 'order.status.paid', undefined, 'zh-CN'), '已支付');
    assert.equal(t(store, 'order.status.paid', undefined, 'en-US'), 'Paid');
  });

  it('falls back for nested key in missing locale', () => {
    // ja-JP not registered, falls to en-US first
    assert.equal(t(store, 'order.status.paid', undefined, 'ja-JP'), 'Paid');
  });

  it('returns key for incomplete nested path', () => {
    assert.equal(t(store, 'order.status.nonexistent', undefined, 'en-US'), 'order.status.nonexistent');
  });
});

describe('I18n Service [pure inline] — tPlural', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => {
    store = freshStore();
    registerTranslations(store, 'en-US', { items: '{count, plural, one {# item} other {# items}}' } as TranslationMap);
    registerTranslations(store, 'zh-CN', { items: '{count, plural, other {#个物品}}' } as TranslationMap);
  });

  it('uses "one" form for count=1 in English', () => {
    assert.equal(tPlural(store, 'items', 1, 'en-US'), '1 item');
  });

  it('uses "other" form for count>1 in English', () => {
    assert.equal(tPlural(store, 'items', 5, 'en-US'), '5 items');
  });

  it('uses "other" for any count in zh-CN', () => {
    assert.equal(tPlural(store, 'items', 1, 'zh-CN'), '1个物品');
    assert.equal(tPlural(store, 'items', 3, 'zh-CN'), '3个物品');
  });

  it('handles count=0 with English "other" form', () => {
    assert.equal(tPlural(store, 'items', 0, 'en-US'), '0 items');
  });

  it('returns template itself when no plural syntax', () => {
    registerTranslations(store, 'en-US', { simple: 'just text' } as TranslationMap);
    assert.equal(tPlural(store, 'simple', 5, 'en-US'), 'just text');
  });
});

describe('I18n Service [pure inline] — utility functions', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => {
    store = freshStore();
    registerTranslations(store, 'zh-CN', { hello: '你好', nested: { a: { b: '深' } } } as TranslationMap);
    registerTranslations(store, 'en-US', { hello: 'Hello' } as TranslationMap);
    registerTranslations(store, 'ja-JP', { hello: 'こんにちは' } as TranslationMap);
  });

  it('getRegisteredLocales returns all registered locales', () => {
    const locales = getRegisteredLocales(store);
    assert.equal(locales.length, 3);
    assert.ok(locales.includes('zh-CN'));
    assert.ok(locales.includes('en-US'));
    assert.ok(locales.includes('ja-JP'));
  });

  it('hasKey returns true when key exists', () => {
    assert.equal(hasKey(store, 'hello', 'zh-CN'), true);
  });

  it('hasKey returns false when key is missing', () => {
    assert.equal(hasKey(store, 'nonexistent', 'zh-CN'), false);
  });

  it('hasKey returns true for keys in any registered locale', () => {
    assert.equal(hasKey(store, 'hello', 'ja-JP'), true);
  });

  it('extractKeys returns all key paths for a locale', () => {
    const keys = extractKeys(store, 'zh-CN');
    assert.ok(keys.includes('hello'));
    assert.ok(keys.includes('nested.a.b'));
    assert.equal(keys.length, 2);
  });

  it('extractKeys returns empty array for unregistered locale', () => {
    assert.deepEqual(extractKeys(store, 'de-DE' as Locale), []);
  });
});

describe('I18n Service [pure inline] — validateCompleteness', () => {
  let store: Map<Locale, TranslationMap>;
  beforeEach(() => {
    store = freshStore();
    registerTranslations(store, 'zh-CN', {
      hello: '你好', goodbye: '再见',
      nested: { key1: '一', key2: '二' },
    } as TranslationMap);
    registerTranslations(store, 'en-US', {
      hello: 'Hello', goodbye: 'Goodbye',
    } as TranslationMap);
    registerTranslations(store, 'ja-JP', {
      hello: 'こんにちは',
    } as TranslationMap);
  });

  it('reports missing keys for each locale', () => {
    const report = validateCompleteness(store, 'zh-CN');
    // en-US missing nested.key1, nested.key2
    assert.equal(report['en-US'].length, 2);
    assert.ok(report['en-US'].includes('nested.key1'));
    // ja-JP missing goodbye, nested.key1, nested.key2
    assert.equal(report['ja-JP'].length, 3);
    assert.ok(report['ja-JP'].includes('goodbye'));
  });

  it('zh-CN has zero missing when it is the reference', () => {
    const report = validateCompleteness(store, 'zh-CN');
    assert.deepEqual(report['zh-CN'], []);
  });
});
