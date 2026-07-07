/**
 * i18n-demo/role.test.ts — 国际化演示页面 L1 角色测试
 *
 * 覆盖: 多语言切换 / 日期格式化 / 数字格式化 / 货币格式化 / 翻译 Key
 * L1 JMeter 风格: 正例 + 反例 + 边界
 *
 * 角色视角:
 *   国际化运营 — 配置多语言展示、验证本地化格式化
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据模型 ──

type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | 'th-TH' | 'vi-VN' | 'id-ID' | 'ms-MY';

const SUPPORTED_LOCALES: Locale[] = [
  'zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
];

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English (US)',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'th-TH': 'ไทย',
  'vi-VN': 'Tiếng Việt',
  'id-ID': 'Bahasa Indonesia',
  'ms-MY': 'Bahasa Melayu',
};

const CURRENCIES: { code: string; symbol: string; locale: Locale }[] = [
  { code: 'CNY', symbol: '¥', locale: 'zh-CN' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  { code: 'THB', symbol: '฿', locale: 'th-TH' },
  { code: 'VND', symbol: '₫', locale: 'vi-VN' },
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID' },
  { code: 'MYR', symbol: 'RM', locale: 'ms-MY' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
];

const TRANSLATION_CATEGORIES = [
  { category: '通用', keys: ['common.ok', 'common.cancel', 'common.confirm', 'common.search', 'common.loading'] },
  { category: '会员', keys: ['member.level', 'member.points', 'member.svip', 'member.upgrade'] },
  { category: '订单', keys: ['order.created', 'order.paid', 'order.refunded', 'order.cancelled'] },
  { category: '积分', keys: ['points.earned', 'points.redeemed', 'points.expired', 'points.insufficient'] },
  { category: '优惠券', keys: ['coupon.issued', 'coupon.used', 'coupon.expired', 'coupon.redeemed'] },
];

// ── 格式化函数（与 page.tsx 一致）──

function formatDateInLocale(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatNumberInLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatCurrencyInLocale(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function formatPercentInLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

// 模拟翻译查找（避免依赖真实的 locale-provider）
function mockTranslate(locale: Locale, key: string): string {
  const zhCN: Record<string, string> = {
    'common.ok': '确定', 'common.cancel': '取消', 'common.confirm': '确认',
    'common.search': '搜索', 'common.loading': '加载中',
    'member.level': '会员等级', 'member.points': '会员积分', 'member.svip': 'SVIP 会员',
    'order.created': '已创建', 'order.paid': '已支付', 'order.refunded': '已退款',
    'points.earned': '获得积分', 'points.redeemed': '已兑换', 'points.expired': '已过期',
    'coupon.issued': '已发放', 'coupon.used': '已使用', 'coupon.expired': '已过期',
  };
  const enUS: Record<string, string> = {
    'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.confirm': 'Confirm',
    'common.search': 'Search', 'common.loading': 'Loading',
    'member.level': 'Member Level', 'member.points': 'Points', 'member.svip': 'SVIP',
    'order.created': 'Created', 'order.paid': 'Paid', 'order.refunded': 'Refunded',
    'points.earned': 'Points Earned', 'points.redeemed': 'Redeemed', 'points.expired': 'Expired',
    'coupon.issued': 'Issued', 'coupon.used': 'Used', 'coupon.expired': 'Expired',
  };
  const map = locale === 'en-US' ? enUS : locale === 'zh-CN' ? zhCN : zhCN;
  return map[key] ?? key;
}

// ── 正例 ──

describe('i18n-demo: 多语言切换与格式化（正例）', () => {

  it('应支持 9 种语言', () => {
    assert.equal(SUPPORTED_LOCALES.length, 9);
  });

  it('每种语言都应有对应标签', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(LOCALE_LABELS[locale], `缺少 ${locale} 的语言标签`);
      assert.ok(LOCALE_LABELS[locale].length > 0);
    }
  });

  it('应支持 8 种货币', () => {
    assert.equal(CURRENCIES.length, 8);
  });

  it('zh-CN 下翻译 Key 应返回中文', () => {
    const ok = mockTranslate('zh-CN', 'common.ok');
    assert.equal(ok, '确定');
    const points = mockTranslate('zh-CN', 'member.points');
    assert.equal(points, '会员积分');
  });

  it('en-US 下翻译 Key 应返回英文', () => {
    const ok = mockTranslate('en-US', 'common.ok');
    assert.equal(ok, 'OK');
    const order = mockTranslate('en-US', 'order.paid');
    assert.equal(order, 'Paid');
  });

  it('日期格式化应随语言变化', () => {
    const date = new Date(2026, 5, 15); // June 15, 2026
    const zhFormat = formatDateInLocale(date, 'zh-CN');
    const enFormat = formatDateInLocale(date, 'en-US');
    // zh-CN 通常会输出带 "6月" 或 "六月"
    assert.ok(zhFormat.includes('6月') || zhFormat.includes('六月'), `zh-CN 格式: ${zhFormat}`);
    // en-US 通常会输出 "June"
    assert.ok(enFormat.includes('June'), `en-US 格式: ${enFormat}`);
  });

  it('数字格式化 100000 在 zh-CN 下应为 "100,000"', () => {
    const result = formatNumberInLocale(100000, 'zh-CN');
    assert.equal(result, '100,000');
  });

  it('货币格式化 1000 USD 应包含 $ 符号', () => {
    const result = formatCurrencyInLocale(1000, 'USD', 'en-US');
    assert.ok(result.includes('$'), `应包含美元符号: ${result}`);
  });

  it('百分比格式化 0.5 应为 "50.0%"', () => {
    const result = formatPercentInLocale(0.5, 'zh-CN');
    assert.equal(result, '50.0%');
  });

  it('翻译分类应包含 5 个类别', () => {
    assert.equal(TRANSLATION_CATEGORIES.length, 5);
  });

  it('页面应导出默认 React 组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', '默认导出应为 React 组件函数');
  });
});

// ── 反例 ──

describe('i18n-demo: 国际化异常处理（反例）', () => {

  it('未知 locale 回退应返回原始 key', () => {
    // 模拟未定义 key 的情况
    const result = mockTranslate('zh-CN', 'nonexistent.key' as any);
    assert.equal(result, 'nonexistent.key');
  });

  it('空字符串应返回空字符串', () => {
    const result = mockTranslate('zh-CN', '' as any);
    assert.equal(result, '');
  });

  it('负数货币格式化不应抛异常', () => {
    const result = formatCurrencyInLocale(-500, 'USD', 'en-US');
    assert.ok(result.includes('-'), '负数应显示负号');
    assert.ok(result.includes('$'), '应包含货币符号');
  });

  it('超大数字格式化不应抛异常', () => {
    const result = formatNumberInLocale(1e15, 'zh-CN');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  it('百分比 0 值应正常显示', () => {
    const result = formatPercentInLocale(0, 'zh-CN');
    assert.equal(result, '0.0%');
  });
});

// ── 边界 ──

describe('i18n-demo: 国际化边界条件（边界）', () => {

  it('zh-CN 和 zh-TW 应视为不同的 locale', () => {
    assert.notEqual(LOCALE_LABELS['zh-CN'], LOCALE_LABELS['zh-TW']);
  });

  it('所有货币符号应不为空', () => {
    for (const c of CURRENCIES) {
      assert.ok(c.symbol.length > 0, `${c.code} symbol 不应为空`);
    }
  });

  it('每种翻译分类应至少包含 4 个 key', () => {
    for (const cat of TRANSLATION_CATEGORIES) {
      assert.ok(cat.keys.length >= 4, `${cat.category} 应至少 4 个 key`);
    }
  });

  it('格式化极小日期（Unix epoch）应正常', () => {
    const date = new Date(0);
    const result = formatDateInLocale(date, 'en-US');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  it('格式化未来日期应正常', () => {
    const date = new Date('2099-12-31');
    const result = formatDateInLocale(date, 'zh-CN');
    assert.ok(result.includes('2099'), '应包含 2099 年');
  });
});
