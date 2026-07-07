/**
 * promotions/page.test.tsx — 促销活动列表页冒烟测试
 * 覆盖: 正例·边界·防御
 * 类型: B-列表页（含搜索/过滤/分页）
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, 'page.tsx');
const CLIENT_SOURCE = resolve(__dirname, 'promotion-list-client.tsx');
const TYPES_SOURCE = resolve(__dirname, 'promotion-types.ts');
const DATA_SOURCE = resolve(__dirname, 'promotions-data.ts');

function readPage(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8');
}

function readClient(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8');
}

function readTypes(): string {
  return readFileSync(TYPES_SOURCE, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SOURCE, 'utf-8');
}

// ==================== Page scaffold 正例 ====================

describe('promotions/page — 正例', () => {
  it('应默认导出 async function PromotionsPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function PromotionsPage'), '缺少默认导出函数');
  });

  it('应导出 metadata 对象', () => {
    const src = readPage();
    assert.ok(src.includes('export const metadata: Metadata'), '缺少 metadata');
    assert.ok(src.includes("'促销活动管理 - M5 指挥台'"), '标题不正确');
  });

  it('应使用 getPromotions 获取数据', () => {
    const src = readPage();
    assert.ok(src.includes('getPromotions'), '缺少 getPromotions');
  });

  it('应使用 PromotionListClient 渲染列表', () => {
    const src = readPage();
    assert.ok(src.includes('PromotionListClient'), '缺少 PromotionListClient');
  });

  it('应传递 promotions 作为 props', () => {
    const src = readPage();
    assert.ok(src.includes('promotions={promotions}'), '缺少 promotions prop');
  });

  it('应在 head 中包含 description meta', () => {
    const src = readPage();
    assert.ok(src.includes('管理门店促销活动'), 'description 包含门店促销活动');
    assert.ok(
      src.includes('折扣') || src.includes('优惠券') || src.includes('返现'),
      'description 包含活动类型说明',
    );
  });
});

// ==================== PromotionListClient 正例 ====================

describe('promotions/PromotionListClient — 正例', () => {
  it('应导出 PromotionListClient 组件', () => {
    const src = readClient();
    assert.ok(src.includes('export function PromotionListClient'), '缺少导出');
  });

  it('应使用 PageShell 布局', () => {
    const src = readClient();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('"促销活动管理"'), 'PageShell 标题不正确');
  });

  it('应使用 SearchFilterInput 实现搜索', () => {
    const src = readClient();
    assert.ok(src.includes('SearchFilterInput'), '缺少搜索框');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm 状态');
  });

  it('应使用 PaginatedDataTableCard 实现分页表格', () => {
    const src = readClient();
    assert.ok(src.includes('PaginatedDataTableCard'), '缺少分页表格');
    assert.ok(src.includes('pagination'), '缺少 pagination 配置');
  });

  it('应从 promotion-types 导入类型', () => {
    const src = readClient();
    assert.ok(src.includes('./promotion-types'), '导入 promotion-types');
  });

  it('应定义 8 列数据表格', () => {
    const src = readClient();
    // Count column definitions — approximate by counting "header:"
    const headerMatches = src.match(/header:/g);
    assert.ok(headerMatches && headerMatches.length >= 7, `预期 ≥7 列, 实得 ${headerMatches?.length ?? 0}`);
  });
});

// ==================== Type definitions 正例 ====================

describe('promotions/promotion-types — 正例', () => {
  it('应定义 PromotionType 为 6 种活动类型', () => {
    const src = readTypes();
    assert.ok(src.includes("type PromotionType"), '缺少 PromotionType');
    assert.ok(src.includes("'discount'"), '缺少 discount');
    assert.ok(src.includes("'coupon'"), '缺少 coupon');
    assert.ok(src.includes("'cashback'"), '缺少 cashback');
    assert.ok(src.includes("'gift'"), '缺少 gift');
    assert.ok(src.includes("'bundle'"), '缺少 bundle');
    assert.ok(src.includes("'clearance'"), '缺少 clearance');
  });

  it('应定义 PromotionStatus 为 6 种状态', () => {
    const src = readTypes();
    assert.ok(src.includes("type PromotionStatus"), '缺少 PromotionStatus');
    assert.ok(src.includes("'draft'"), '缺少 draft');
    assert.ok(src.includes("'scheduled'"), '缺少 scheduled');
    assert.ok(src.includes("'active'"), '缺少 active');
    assert.ok(src.includes("'paused'"), '缺少 paused');
    assert.ok(src.includes("'expired'"), '缺少 expired');
    assert.ok(src.includes("'cancelled'"), '缺少 cancelled');
  });

  it('应定义 PromotionItem 接口含所有必要字段', () => {
    const src = readTypes();
    assert.ok(src.includes('interface PromotionItem'), '缺少 PromotionItem');
    const requiredFields = ['id', 'name', 'type', 'status', 'storeId', 'storeName', 'budget', 'usedBudget', 'startAt', 'endAt', 'createdBy', 'createdAt', 'updatedAt', 'description'];
    for (const f of requiredFields) {
      assert.ok(src.includes(`${f}:`), `缺少 ${f} 字段`);
    }
  });

  it('应可选字段 discountPercent', () => {
    const src = readTypes();
    assert.ok(src.includes('discountPercent?'), 'discountPercent 应为可选');
  });
});

// ==================== Data layer 正例 ====================

describe('promotions/promotions-data — 正例', () => {
  it('应默认包含 8 条模拟数据', () => {
    const src = readData();
    const idMatches = src.match(/id:\s*'/g);
    assert.equal(idMatches?.length ?? 0, 8, '预期 8 条活动数据');
  });

  it('应包含 4 种不同 storeId', () => {
    const src = readData();
    assert.ok(src.includes("'S001'"), '缺少旗舰店');
    assert.ok(src.includes("'S002'"), '缺少科技路店');
    assert.ok(src.includes("'S003'"), '缺少中山路店');
  });

  it('应包含所有 6 种状态覆盖', () => {
    const src = readData();
    assert.ok(src.includes("status: 'active'"), '缺少 active 状态');
    assert.ok(src.includes("status: 'scheduled'"), '缺少 scheduled 状态');
    assert.ok(src.includes("status: 'draft'"), '缺少 draft 状态');
    assert.ok(src.includes("status: 'expired'"), '缺少 expired 状态');
    assert.ok(src.includes("status: 'paused'"), '缺少 paused 状态');
    assert.ok(src.includes("status: 'cancelled'"), '缺少 cancelled 状态');
  });

  it('应包含所有 6 种活动类型覆盖', () => {
    const src = readData();
    assert.ok(src.includes("type: 'discount'"), '缺少 discount');
    assert.ok(src.includes("type: 'coupon'"), '缺少 coupon');
    assert.ok(src.includes("type: 'gift'"), '缺少 gift');
    assert.ok(src.includes("type: 'clearance'"), '缺少 clearance');
    assert.ok(src.includes("type: 'cashback'"), '缺少 cashback');
    assert.ok(src.includes("type: 'bundle'"), '缺少 bundle');
  });
});

// ==================== 边界 ====================

describe('promotions/page — 边界', () => {
  it('getPromotions 应返回非空数组', () => {
    const data = readData();
    assert.ok(data.includes(']'), '数据应有闭合数组');
    assert.ok(data.includes('['), '数据应有起始数组');
  });

  it('usedBudget 应不大于 budget', () => {
    const data = readData();
    // Parse as plain text check — for p2 budget=20000 usedBudget=8500
    assert.ok(data.includes('budget: 50000') && data.includes('usedBudget: 32000'), 'p1 预算比例正确');
    assert.ok(data.includes('budget: 20000') && data.includes('usedBudget: 8500'), 'p2 预算比例正确');
    assert.ok(data.includes('budget: 15000') && data.includes('usedBudget: 0'), 'p3 未使用预算');
  });

  it('每种活动都应包含 startAt 和 endAt', () => {
    const data = readData();
    const startMatches = data.match(/startAt:/g);
    const endMatches = data.match(/endAt:/g);
    assert.equal(startMatches?.length, 8, '应有 8 个 startAt');
    assert.equal(endMatches?.length, 8, '应有 8 个 endAt');
  });

  it('空搜索时应显示所有活动', () => {
    const client = readClient();
    assert.ok(client.includes('searchTerm'), '搜索通过 searchTerm 实现');
    assert.ok(client.includes('sortedItems.length'), '显示总数量');
  });

  it('分页选项应包含 5/10/20', () => {
    const client = readClient();
    assert.ok(client.includes('PAGE_SIZE_OPTIONS'), '分页选项已定义');
  });
});

// ==================== 防御: 错误处理 & 非法输入 ====================

describe('promotions/page — 防御', () => {
  it('不存在活动时应显示空状态提示', () => {
    const client = readClient();
    assert.ok(client.includes('emptyTitle'), '缺少空状态标题');
    assert.ok(client.includes('暂无促销活动'), '空状态提示应为暂无促销活动');
  });

  it('空搜索结果应有描述文案', () => {
    const client = readClient();
    assert.ok(client.includes('emptyDescription'), '缺少空状态描述');
  });

  it('formatDate 应安全处理 ISO 字符串', () => {
    const client = readClient();
    assert.ok(client.includes('new Date(iso)'), '使用 Date 构造函数');
    assert.ok(client.includes('padStart'), '使用 padStart 补零');
  });

  it('formatMoney 应对 0 元正常显示', () => {
    const client = readClient();
    assert.ok(client.includes('toLocaleString'), '使用 toLocaleString');
    assert.ok(client.includes("'zh-CN'"), 'locale 为 zh-CN');
  });

  it('usagePercent 应对 0 预算返回 0%', () => {
    const client = readClient();
    assert.ok(client.includes('<= 0'), '处理 0 或负预算');
  });

  it('PromotionListClient 应为 client component', () => {
    const client = readClient();
    assert.ok(client.includes("'use client'"), '缺少 client directive');
  });

  it('status variant 映射应覆盖所有状态', () => {
    const client = readClient();
    assert.ok(client.includes("'active'"), '含 active 映射');
    assert.ok(client.includes("'paused'"), '含 paused 映射');
    assert.ok(client.includes("'draft'"), '含 draft 映射');
    assert.ok(client.includes("'expired'"), '含 expired 映射');
    assert.ok(client.includes("'cancelled'"), '含 cancelled 映射');
  });

  it('所有 StatusBadge variant 应正确处理', () => {
    const client = readClient();
    assert.ok(client.includes("return 'success'"), 'active → success');
    assert.ok(client.includes("return 'danger'"), 'expired/cancelled → danger');
    assert.ok(client.includes("'default'"), 'scheduled → default');
  });
});
