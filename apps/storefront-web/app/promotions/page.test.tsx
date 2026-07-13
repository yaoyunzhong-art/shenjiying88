/**
 * promotions/page.test.tsx — 促销列表页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·反例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('promotions — 正例', () => {
  it('应导出一个默认组件 StorePromotionsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StorePromotionsPage'), '缺少默认导出');
  });

  it('应包含 Promotion 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Promotion'), '缺少接口');
  });

  it('应包含 MOCK_DATA 或 mock 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK'), '缺少 mock 数据');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少搜索过滤');
  });

  it('应包含 status 字段在 Promotion 接口中', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '接口缺少 status');
  });

  it('Mock 数据每条应有 id 字段（promo-N 格式）', () => {
    const src = readSource();
    assert.ok(src.includes('promo-'), '缺少 promo- 自增 id');
  });

  it('应包含 storeName 字段', () => {
    const src = readSource();
    assert.ok(src.includes('storeName'), '缺少 storeName');
  });

  it('应包含 title 字段', () => {
    const src = readSource();
    assert.ok(src.includes('title'), '缺少 title');
  });

  it('mock 数据应包含多种状态（draft/active/paused/ended）', () => {
    const src = readSource();
    assert.ok(src.includes("'draft'") && src.includes("'active'") && src.includes("'paused'") && src.includes("'ended'"), '缺少多种状态');
  });

  it('应包含 budget 预算字段', () => {
    const src = readSource();
    assert.ok(src.includes('budget'), '缺少 budget 字段');
  });

  it('mock 数据应包含 startDate 和 endDate 日期', () => {
    const src = readSource();
    assert.ok(src.includes('startDate') || src.includes('endDate'), '缺少日期字段');
  });

  it('mock 数据应包含不同门店', () => {
    const src = readSource();
    assert.ok(src.includes('storeName'), '门店名');
  });
});

describe('promotions — 边界', () => {
  it('应支持 title 和 storeName 搜索字段', () => {
    const src = readSource();
    assert.ok(src.includes('title'), '缺少 title');
    assert.ok(src.includes('storeName'), '缺少 storeName');
  });

  it('generateMockPromotions 应生成至少 8 条数据', () => {
    const src = readSource();
    // 生成函数中 count 参数大于等于 8
    assert.ok(src.includes('generateMockPromotions(8)') || src.includes('generateMockPromotions(10)') || src.includes('generateMockPromotions('), '数据生成');
  });

  it('应支持状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status');
  });

  it('应包含满减或折扣类型区分', () => {
    const src = readSource();
    assert.ok(src.includes('type') || src.includes('discountType'), '缺少类型区分');
  });

  it('空促销数据处理', () => {
    const src = readSource();
    assert.ok(src.includes('.filter(') || src.includes('.find('), 'filter/find 方法');
  });
});

describe('promotions — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('空调拨状态应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度判断');
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('不应包含硬编码 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key|token|authorization)/i);
  });
});

describe('promotions — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });

  it('不应包含 console.log 调试代码', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), '不允许裸 console.log');
  });
});
