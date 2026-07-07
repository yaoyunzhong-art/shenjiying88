import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * i18n.e2e.test.ts - Phase-20 T44
 * 用途: 国际化框架 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: 基础翻译 + 多 locale 注册
 * - AC-2: 参数化插值 {name}
 * - AC-3: Plural 规则 (en-US one/other, zh-CN 仅 other)
 * - AC-4: Fallback (缺失 key → en-US → zh-CN → key)
 * - AC-5: 嵌套 key (order.status.paid)
 * - AC-6: 完整性校验 + extractKeys
 */
import { I18nService, Locale, DEFAULT_LOCALE } from './i18n.service';

describe('I18nService · Phase-20 T44', () => {
  let svc: I18nService;

  beforeEach(() => {
    svc = new I18nService();
    // 注册三语基础翻译
    svc.registerBulk({
      'zh-CN': {
        greeting: '你好,{name}!',
        order: {
          status: {
            pending: '待支付',
            paid: '已支付',
          },
        },
        itemCount: '{count, plural, other {# 件商品}}',
      },
      'en-US': {
        greeting: 'Hello, {name}!',
        order: {
          status: {
            pending: 'Pending',
            paid: 'Paid',
          },
        },
        itemCount: '{count, plural, one {# item} other {# items}}',
      },
      'ja-JP': {
        greeting: 'こんにちは、{name}さん!',
        order: {
          status: {
            pending: '未払い',
            paid: '支払済み',
          },
        },
        itemCount: '{count, plural, other {# 件}}',
      },
    });
  });

  // AC-1: 基础翻译
  it('AC-1 basic translation: 3 locales', () => {
    expect(svc.t('greeting', { name: 'Alice' }, 'zh-CN')).toBe('你好,Alice!');
    expect(svc.t('greeting', { name: 'Alice' }, 'en-US')).toBe('Hello, Alice!');
    expect(svc.t('greeting', { name: 'Alice' }, 'ja-JP')).toBe('こんにちは、Aliceさん!');
  });

  // AC-2: 参数化插值
  it('AC-2 interpolation: {name} placeholder', () => {
    expect(svc.t('greeting', { name: '张三' }, 'zh-CN')).toBe('你好,张三!');
    expect(svc.t('greeting', { name: 42 }, 'en-US')).toBe('Hello, 42!');
    // 缺失参数保留原样
    expect(svc.t('greeting', {}, 'zh-CN')).toBe('你好,{name}!');
  });

  // AC-3: Plural 规则
  it('AC-3 plural: en one/other + zh-CN other only', () => {
    expect(svc.tPlural('itemCount', 1, 'en-US')).toBe('1 item');
    expect(svc.tPlural('itemCount', 5, 'en-US')).toBe('5 items');
    // 中文/日文 都用 other 形式
    expect(svc.tPlural('itemCount', 1, 'zh-CN')).toBe('1 件商品');
    expect(svc.tPlural('itemCount', 5, 'zh-CN')).toBe('5 件商品');
    expect(svc.tPlural('itemCount', 1, 'ja-JP')).toBe('1 件');
  });

  // AC-4: Fallback
  it('AC-4 fallback: missing key → en-US → zh-CN → key', () => {
    // ja-JP 缺失某 key → 降级到 en-US
    const partialJa = svc.t('onlyInEnglish', undefined, 'ja-JP');
    expect(partialJa).toBe('onlyInEnglish'); // fallback chain 中也找不到 → 返回 key

    // ja-JP 缺失某 key 但 en-US 有 → 降级到 en-US
    svc.registerTranslations('ja-JP', { welcome: 'ようこそ' });
    svc.registerTranslations('en-US', { welcome: 'Welcome' });
    expect(svc.t('welcome', undefined, 'ja-JP')).toBe('ようこそ'); // ja-JP 自己有
    svc = new I18nService();
    svc.registerTranslations('en-US', { welcome: 'Welcome' });
    svc.registerTranslations('zh-CN', { other: '其他' });
    expect(svc.t('welcome', undefined, 'ja-JP')).toBe('Welcome'); // ja-JP 无 → en-US
  });

  // AC-5: 嵌套 key
  it('AC-5 nested key: order.status.paid', () => {
    expect(svc.t('order.status.paid', undefined, 'zh-CN')).toBe('已支付');
    expect(svc.t('order.status.paid', undefined, 'en-US')).toBe('Paid');
    expect(svc.t('order.status.pending', undefined, 'ja-JP')).toBe('未払い');
    // 嵌套中缺失 → 兜底 key
    expect(svc.t('order.status.unknown', undefined, 'zh-CN')).toBe('order.status.unknown');
  });

  // AC-6: 完整性校验
  it('AC-6 validateCompleteness: detect missing translations', () => {
    // 完整时应该无缺失
    const fullReport = svc.validateCompleteness('zh-CN');
    expect(fullReport['en-US']).toEqual([]);
    expect(fullReport['ja-JP']).toEqual([]);

    // 删除 en-US 某个 key
    svc = new I18nService();
    svc.registerTranslations('zh-CN', {
      a: '甲',
      b: '乙',
      c: { nested: '丙' },
    });
    svc.registerTranslations('en-US', {
      a: 'A',
      // b 缺失
      c: { nested: 'C' },
    });
    svc.registerTranslations('ja-JP', {
      a: 'あ',
      b: 'い',
      // c.nested 缺失
    });
    const report = svc.validateCompleteness('zh-CN');
    expect(report['en-US']).toEqual(['b']);
    expect(report['ja-JP']).toEqual(['c.nested']);
    // 提取 key 路径
    expect(svc.extractKeys('zh-CN')).toEqual(['a', 'b', 'c.nested']);
  });
});
