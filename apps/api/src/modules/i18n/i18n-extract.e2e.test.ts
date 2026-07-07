import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * i18n-extract.e2e.test.ts - Phase-20 T46
 * 用途: 翻译 key 提取 + 校验 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: 从源码提取 t('key') 调用
 * - AC-2: tPlural 也支持
 * - AC-3: 多文件聚合
 * - AC-4: 生成空模板
 * - AC-5: 校验完整性
 * - AC-6: 与 service 比对 → missing/unused
 */
import {
  extractKeysFromSource,
  extractKeysFromFiles,
  generateTranslationTemplate,
  validateTranslationFiles,
  diffWithService,
} from './i18n-extract';
import { I18nService, Locale } from './i18n.service';

describe('i18n-extract · Phase-20 T46', () => {
  // AC-1: 单文件提取
  it('AC-1 extractKeysFromSource: scan t() calls', () => {
    const source = `
      const greeting = svc.t('greeting', { name: 'Alice' });
      const order = svc.t("order.status.paid");
      const tag = svc.t(\`tag\`);
    `;
    const keys = extractKeysFromSource(source);
    expect(keys).toEqual(['greeting', 'order.status.paid', 'tag']);
  });

  // AC-2: tPlural 支持
  it('AC-2 extractKeysFromSource: tPlural support', () => {
    const source = `
      const items = svc.tPlural('itemCount', 5);
      const alt = svc.tp('alt.count', 2);
    `;
    const keys = extractKeysFromSource(source);
    expect(keys).toContain('itemCount');
    expect(keys).toContain('alt.count');
  });

  // AC-3: 多文件聚合
  it('AC-3 extractKeysFromFiles: aggregate across files', () => {
    const files = [
      { path: 'a.ts', content: `svc.t('key1'); svc.t('key2');` },
      { path: 'b.ts', content: `svc.t('key2'); svc.t('key3');` },
    ];
    const result = extractKeysFromFiles(files);
    expect(result.length).toBe(2);
    expect(result[0].keys).toEqual(['key1', 'key2']);
    expect(result[1].keys).toEqual(['key2', 'key3']);
  });

  // AC-4: 生成空模板
  it('AC-4 generateTranslationTemplate: TODO placeholders', () => {
    const keys = ['greeting', 'order.status.paid'];
    const tmpl = generateTranslationTemplate(keys, 'en-US');
    expect(tmpl.greeting).toBe('TODO[en-US]');
    expect(tmpl['order.status.paid']).toBe('TODO[en-US]');
    expect(Object.keys(tmpl).length).toBe(2);
  });

  // AC-5: 校验完整性
  it('AC-5 validateTranslationFiles: completeness report', () => {
    const files = new Map<Locale, Record<string, string>>();
    files.set('zh-CN', {
      a: '甲',
      b: '乙',
      c: '丙',
    });
    files.set('en-US', {
      a: 'A',
      b: '', // 空值
      // c 缺失
    });
    files.set('ja-JP', {
      a: 'あ',
      b: 'い',
      c: 'TODO[ja-JP]', // 占位符 (视为空)
    });

    const report = validateTranslationFiles(files, 'zh-CN');
    expect(report.totalKeys).toBe(3);
    expect(report.completeness['zh-CN'].present).toBe(3);
    expect(report.completeness['en-US'].present).toBe(2); // a + b (即使 b 空值也算 present)
    expect(report.completeness['en-US'].missing).toBe(1);
    expect(report.completeness['en-US'].missingKeys).toEqual(['c']);
    expect(report.emptyValues['en-US']).toContain('b');
    expect(report.emptyValues['ja-JP']).toContain('c');
  });

  // AC-6: 与 service 比对
  it('AC-6 diffWithService: missing + unused detection', () => {
    const svc = new I18nService();
    svc.registerTranslations('zh-CN', {
      registered: '已注册',
      'also-registered': '也注册',
    });
    const sourceKeys = ['registered', 'new-key-not-in-service'];
    const diff = diffWithService(svc, sourceKeys, 'zh-CN');
    expect(diff.missingInLocale).toEqual(['new-key-not-in-service']);
    expect(diff.unusedInCode).toEqual(['also-registered']);
  });
});
