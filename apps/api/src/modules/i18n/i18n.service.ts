/**
 * i18n.service.ts - Phase-20 T44
 * 用途: 国际化 (i18n) 框架
 * 关联: phase-20-compliance/spec.md §Phase 3
 *
 * 核心:
 * - Locale: 'zh-CN' | 'en-US' | 'ja-JP'
 * - 翻译资源: Record<locale, Record<key, message>>
 * - 参数化插值: {varName}
 * - Fallback: zh-CN → en-US → key
 * - Plural: {count, plural, one {# item} other {# items}}
 */
import { Injectable, Logger } from '@nestjs/common';

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP';
export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US', 'ja-JP'];
export const DEFAULT_LOCALE: Locale = 'zh-CN';

export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationMap = Record<string, TranslationValue>;

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private readonly translations = new Map<Locale, TranslationMap>();
  private readonly pluralRules = new Map<Locale, (n: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'>();

  constructor() {
    // 注册 plural rules (CLDR 简化版)
    this.pluralRules.set('zh-CN', () => 'other'); // 中文无单复数
    this.pluralRules.set('en-US', (n) => (n === 1 ? 'one' : 'other'));
    this.pluralRules.set('ja-JP', () => 'other'); // 日文同中文
  }

  /**
   * 注册翻译资源
   */
  registerTranslations(locale: Locale, map: TranslationMap): void {
    const existing = this.translations.get(locale) ?? {};
    this.translations.set(locale, { ...existing, ...map });
  }

  /**
   * 批量注册多个 locale
   */
  registerBulk(maps: Record<Locale, TranslationMap>): void {
    for (const [locale, map] of Object.entries(maps) as [Locale, TranslationMap][]) {
      this.registerTranslations(locale, map);
    }
  }

  /**
   * 翻译单个 key
   * @param key 翻译键 (支持嵌套路径: 'order.status.paid')
   * @param params 插值参数
   * @param locale 目标 locale,默认 DEFAULT_LOCALE
   */
  t(
    key: string,
    params?: Record<string, string | number>,
    locale: Locale = DEFAULT_LOCALE,
  ): string {
    // 按 locale 顺序查找: target → fallback (en-US) → default (zh-CN) → key
    const lookupOrder: Locale[] = [locale, 'en-US' as Locale, DEFAULT_LOCALE];
    for (const loc of lookupOrder) {
      const map = this.translations.get(loc);
      if (!map) continue;
      const value = this.lookupKey(map, key);
      if (value !== undefined) {
        return this.interpolate(value, params, loc);
      }
    }
    return key; // 兜底返回 key
  }

  /**
   * 嵌套 key 查找: 'order.status.paid' → map.order.status.paid
   */
  private lookupKey(map: TranslationMap, key: string): string | undefined {
    const parts = key.split('.');
    let current: any = map;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * 参数化插值: {name} → params.name
   * 支持类型: string/number
   */
  private interpolate(
    template: string,
    params?: Record<string, string | number>,
    locale?: Locale,
  ): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in params) return String(params[key]);
      return match; // 缺失参数保留原样
    });
  }

  /**
   * 带 plural 的翻译
   * 语法: '{count, plural, one {# item} other {# items}}'
   * @param key 翻译键
   * @param count 数量
   * @param locale 目标 locale
   */
  tPlural(key: string, count: number, locale: Locale = DEFAULT_LOCALE): string {
    const template = this.t(key, undefined, locale);
    const pluralForms = this.parsePluralTemplate(template);
    if (!pluralForms) return template;

    const rule = this.pluralRules.get(locale) ?? this.pluralRules.get(DEFAULT_LOCALE)!;
    const form = rule(count);
    const pattern = pluralForms[form] ?? pluralForms.other ?? Object.values(pluralForms)[0];

    // 替换 # 为 count
    return pattern.replace(/#/g, String(count));
  }

  /**
   * 解析 plural 模板: '{count, plural, one {# item} other {# items}}'
   */
  private parsePluralTemplate(template: string): Record<string, string> | null {
    const match = template.match(/\{(\w+),\s*plural,\s*(.+)\}$/);
    if (!match) return null;
    const inner = match[2];
    // 解析 "one {x} other {y}"
    const forms: Record<string, string> = {};
    const formRegex = /(\w+)\s*\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = formRegex.exec(inner)) !== null) {
      forms[m[1]] = m[2];
    }
    return Object.keys(forms).length > 0 ? forms : null;
  }

  /**
   * 获取所有已注册 locale
   */
  getRegisteredLocales(): Locale[] {
    return Array.from(this.translations.keys());
  }

  /**
   * 检查 key 在指定 locale 是否存在
   */
  hasKey(key: string, locale: Locale): boolean {
    const map = this.translations.get(locale);
    if (!map) return false;
    return this.lookupKey(map, key) !== undefined;
  }

  /**
   * 提取所有 key 路径 (用于校验完整性)
   */
  extractKeys(locale: Locale): string[] {
    const map = this.translations.get(locale);
    if (!map) return [];
    const keys: string[] = [];
    const walk = (obj: any, prefix: string) => {
      for (const [k, v] of Object.entries(obj)) {
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

  /**
   * 校验多语言完整性 - 返回缺失的 key 列表
   */
  validateCompleteness(referenceLocale: Locale = DEFAULT_LOCALE): Record<Locale, string[]> {
    const refKeys = new Set(this.extractKeys(referenceLocale));
    const result: Record<Locale, string[]> = {
      'zh-CN': [],
      'en-US': [],
      'ja-JP': [],
    };
    for (const loc of SUPPORTED_LOCALES) {
      const locKeys = new Set(this.extractKeys(loc));
      const missing: string[] = [];
      for (const k of refKeys) {
        if (!locKeys.has(k)) missing.push(k);
      }
      result[loc] = missing;
    }
    return result;
  }
}