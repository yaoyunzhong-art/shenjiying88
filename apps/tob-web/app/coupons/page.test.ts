/**
 * coupons/page.test.ts — 优惠券管理列表页 全量测试
 *
 * 覆盖: 正例(组件导出/数据导出/页面结构) · 边界(枚举覆盖/字段完整性/Mock完整性) · 防御(空态/边界值)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE_SRC = resolve(__dirname, 'page.tsx');
const DATA_SRC = resolve(__dirname, 'coupons-data.ts');

function readPage(): string {
  return readFileSync(PAGE_SRC, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SRC, 'utf-8');
}

// ——— 正例: 页面导出结构 ———
describe('coupons — 正例: 页面导出', () => {
  it('page.tsx 应导出默认组件 CouponsListPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function CouponsListPage'), '缺少默认导出组件 CouponsListPage');
  });

  it('page.tsx 应包含 \'use client\' 指令', () => {
    const src = readPage();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('page.tsx 从 react 导入 useState / useMemo', () => {
    const src = readPage();
    assert.ok(src.includes('useState'), '缺少 useState');
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('page.tsx 从 @m5/ui 导入 DataTable / PageShell / Pagination / SearchFilterInput / StatusBadge / Tabs', () => {
    const src = readPage();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });

  it('page.tsx 从 @m5/ui 导入 usePagination / useSearchFilter / useSortedItems', () => {
    const src = readPage();
    assert.ok(src.includes('usePagination'), '缺少 usePagination');
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('page.tsx 从 ./coupons-data 导入 Coupon / CouponType / CouponStatus 类型', () => {
    const src = readPage();
    assert.ok(src.includes("import type { Coupon, CouponType, CouponStatus }"), '缺少类型导入');
  });

  it('page.tsx 从 ./coupons-data 导入 MOCK_COUPONS / TYPE_LABELS / STATUS_LABELS', () => {
    const src = readPage();
    assert.ok(src.includes('MOCK_COUPONS'), '缺少 MOCK_COUPONS');
    assert.ok(src.includes('TYPE_LABELS'), '缺少 TYPE_LABELS');
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
  });

  it('page.tsx 使用 PageShell title="优惠券管理"', () => {
    const src = readPage();
    assert.ok(src.includes('title="优惠券管理"'), '缺少 title="优惠券管理"');
  });

  it('page.tsx 包含 SearchFilterInput 搜索框', () => {
    const src = readPage();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('placeholder='), '缺少 placeholder');
  });

  it('page.tsx 包含类型 Tabs 与状态 Tabs 双重筛选', () => {
    const src = readPage();
    assert.ok(src.includes('typeFilter'), '缺少 typeFilter');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('page.tsx 包含 DataTable 组件', () => {
    const src = readPage();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('columns={COLUMNS}'), '缺少 columns={COLUMNS}');
  });

  it('page.tsx 包含空状态提示', () => {
    const src = readPage();
    assert.ok(src.includes('未找到匹配的优惠券'), '缺少空状态提示');
  });

  it('page.tsx 包含 Pagination 分页组件', () => {
    const src = readPage();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('page='), '缺少 page 属性');
  });

  it('page.tsx 包含 4 个 StatBadge 统计卡片', () => {
    const src = readPage();
    const stats = [...src.matchAll(/StatBadge/g)];
    assert.ok(stats.length >= 4, `预期至少 4 个 StatBadge，找到 ${stats.length}`);
  });
});

// ——— 正例: 数据类型层完整性 ———
describe('coupons — 正例: 数据层', () => {
  it('coupons-data.ts 应导出 CouponType / CouponStatus 类型联合', () => {
    const src = readData();
    assert.ok(src.includes('export type CouponType'), '缺少 CouponType');
    assert.ok(src.includes('export type CouponStatus'), '缺少 CouponStatus');
  });

  it('coupons-data.ts 应导出 Coupon 接口', () => {
    const src = readData();
    assert.ok(src.includes('export interface Coupon'), '缺少 Coupon 接口');
  });

  it('coupons-data.ts 应导出 TYPE_LABELS / STATUS_LABELS 常量', () => {
    const src = readData();
    assert.ok(src.includes('export const TYPE_LABELS'), '缺少 TYPE_LABELS');
    assert.ok(src.includes('export const STATUS_LABELS'), '缺少 STATUS_LABELS');
  });

  it('coupons-data.ts 应导出 MOCK_COUPONS 数据集', () => {
    const src = readData();
    assert.ok(src.includes('export const MOCK_COUPONS'), '缺少 MOCK_COUPONS');
  });

  it('MOCK_COUPONS 至少包含 15 条记录', () => {
    const src = readData();
    const matches = [...src.matchAll(/name:\s*'/g)];
    assert.ok(matches.length >= 15, `预期至少 15 条，实际 ${matches.length}`);
  });

  it('createMockCoupons 函数存在于数据文件中', () => {
    const src = readData();
    assert.ok(src.includes('function createMockCoupons'), '缺少 createMockCoupons');
  });
});

// ——— 边界: 枚举覆盖 ———
describe('coupons — 边界: 枚举覆盖', () => {
  it('CouponType 包含 discount / cash / free_shipping / voucher', () => {
    const src = readData();
    assert.ok(src.includes("'discount'"), '缺少 discount');
    assert.ok(src.includes("'cash'"), '缺少 cash');
    assert.ok(src.includes("'free_shipping'"), '缺少 free_shipping');
    assert.ok(src.includes("'voucher'"), '缺少 voucher');
  });

  it('CouponStatus 包含 active / expired / disabled', () => {
    const src = readData();
    assert.ok(src.includes("'active'"), '缺少 active');
    assert.ok(src.includes("'expired'"), '缺少 expired');
    assert.ok(src.includes("'disabled'"), '缺少 disabled');
  });

  it('TYPE_LABELS 覆盖全部 4 种券类型', () => {
    const src = readData();
    assert.ok(src.includes('discount:'), 'TYPE_LABELS 缺少 discount');
    assert.ok(src.includes('cash:'), 'TYPE_LABELS 缺少 cash');
    assert.ok(src.includes('free_shipping:'), 'TYPE_LABELS 缺少 free_shipping');
    assert.ok(src.includes('voucher:'), 'TYPE_LABELS 缺少 voucher');
  });

  it('STATUS_LABELS 覆盖全部 3 种状态', () => {
    const src = readData();
    assert.ok(src.includes('active:'), 'STATUS_LABELS 缺少 active');
    assert.ok(src.includes('expired:'), 'STATUS_LABELS 缺少 expired');
    assert.ok(src.includes('disabled:'), 'STATUS_LABELS 缺少 disabled');
  });

  it('TYPE_VARIANTS 覆盖全部 4 种类型配色', () => {
    const page = readPage();
    assert.ok(page.includes("discount: 'success'"), 'discount variant 异常');
    assert.ok(page.includes("cash: 'warning'"), 'cash variant 异常');
    assert.ok(page.includes("free_shipping: 'info'"), 'free_shipping variant 异常');
    assert.ok(page.includes("voucher: 'danger'"), 'voucher variant 异常');
  });

  it('STATUS_VARIANTS 覆盖全部 3 种状态配色', () => {
    const page = readPage();
    assert.ok(page.includes("active: 'success'"), 'active variant 异常');
    assert.ok(page.includes("expired: 'neutral'"), 'expired variant 异常');
    assert.ok(page.includes("disabled: 'warning'"), 'disabled variant 异常');
  });
});

// ——— 边界: Coupon 字段完整性 ———
describe('coupons — 边界: Coupon 字段', () => {
  it('Coupon 接口包含 id / name / type / value / status 核心字段', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface Coupon'), src.indexOf('}'));
    assert.ok(iface.includes('id'), '缺少 id');
    assert.ok(iface.includes('name'), '缺少 name');
    assert.ok(iface.includes('type'), '缺少 type');
    assert.ok(iface.includes('value'), '缺少 value');
    assert.ok(iface.includes('status'), '缺少 status');
  });

  it('Coupon 接口包含核销相关字段 usedCount / totalIssued', () => {
    const src = readData();
    assert.ok(src.includes('usedCount'), '缺少 usedCount');
    assert.ok(src.includes('totalIssued'), '缺少 totalIssued');
  });

  it('Coupon 接口包含有效期字段 validFrom / validTo', () => {
    const src = readData();
    assert.ok(src.includes('validFrom'), '缺少 validFrom');
    assert.ok(src.includes('validTo'), '缺少 validTo');
  });

  it('Coupon 接口包含市场 / 品牌 / 创建人字段', () => {
    const src = readData();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
    assert.ok(src.includes('brandCode'), '缺少 brandCode');
    assert.ok(src.includes('createdBy'), '缺少 createdBy');
  });

  it('COLUMNS 定义 8 列对应 Coupon 字段', () => {
    const page = readPage();
    assert.ok(page.includes('header: \'券名称\''), '缺少 券名称');
    assert.ok(page.includes('header: \'类型\''), '缺少 类型');
    assert.ok(page.includes('header: \'面值\''), '缺少 面值');
    assert.ok(page.includes('header: \'核销\''), '缺少 核销');
    assert.ok(page.includes('header: \'有效期\''), '缺少 有效期');
    assert.ok(page.includes('header: \'市场\''), '缺少 市场');
    assert.ok(page.includes('header: \'状态\''), '缺少 状态');
    assert.ok(page.includes('header: \'创建人\''), '缺少 创建人');
  });

  it('COLUMNS 包含 sortable 字段 (name / marketCode)', () => {
    const page = readPage();
    const sortableMatches = [...page.matchAll(/sortable:\s*true/g)];
    assert.ok(sortableMatches.length >= 2, `预期至少 2 个 sortable 列，找到 ${sortableMatches.length}`);
  });
});

// ——— 边界: 统计与搜索 ———
describe('coupons — 边界: 统计与搜索', () => {
  it('搜索字段包含 name / type / marketCode / brandCode / createdBy / value', () => {
    const page = readPage();
    assert.ok(page.includes("'name'"), '搜索字段缺少 name');
    assert.ok(page.includes("'type'"), '搜索字段缺少 type');
    assert.ok(page.includes("'marketCode'"), '搜索字段缺少 marketCode');
    assert.ok(page.includes("'brandCode'"), '搜索字段缺少 brandCode');
    assert.ok(page.includes("'createdBy'"), '搜索字段缺少 createdBy');
    assert.ok(page.includes("'value'"), '搜索字段缺少 value');
  });

  it('stat 统计计算 active / totalIssued / totalUsed', () => {
    const page = readPage();
    assert.ok(page.includes('stats.total'), '缺少 stats.total');
    assert.ok(page.includes('stats.active'), '缺少 stats.active');
    assert.ok(page.includes('stats.totalIssued'), '缺少 stats.totalIssued');
    assert.ok(page.includes('stats.totalUsed'), '缺少 stats.totalUsed');
  });

  it('StatBadge 显示优惠券总数 label="优惠券总数"', () => {
    const page = readPage();
    assert.ok(page.includes('label="优惠券总数"'), '缺少总数标签');
  });

  it('StatBadge 显示进行中 label="进行中"', () => {
    const page = readPage();
    assert.ok(page.includes('label="进行中"'), '缺少进行中标签');
  });

  it('StatBadge 显示总发放 label="总发放"', () => {
    const page = readPage();
    assert.ok(page.includes('label="总发放"'), '缺少总发放标签');
  });

  it('StatBadge 显示已核销 label="已核销"', () => {
    const page = readPage();
    assert.ok(page.includes('label="已核销"'), '缺少已核销标签');
  });

  it('typeFilter 默认值为 ALL', () => {
    const page = readPage();
    assert.ok(page.includes("'ALL'"), 'filter 缺少 ALL 默认值');
  });

  it('分页 pageSize 为 10', () => {
    const page = readPage();
    assert.ok(page.includes('10'), '缺少 pageSize 10');
  });
});

// ——— 防御: 空态与边界 ———
describe('coupons — 防御: 空态与边界', () => {
  it('sortedItems 为空时渲染空状态提示', () => {
    const page = readPage();
    assert.ok(page.includes('sortedItems.length === 0'), '缺少空态判断');
    assert.ok(page.includes('未找到匹配的优惠券'), '缺少空态文案');
  });

  it('sortedItems 不为空时显示 Pagination', () => {
    const page = readPage();
    assert.ok(page.includes('sortedItems.length > 0'), '缺少非空分页条件');
  });

  it('typeFiltered 使用 useMemo 避免重算', () => {
    const page = readPage();
    assert.ok(page.includes('useMemo'), '缺少 useMemo');
    assert.ok(page.includes('typeFilter === \'ALL\''), '缺少 typeFilter === \'ALL\'');
  });

  it('statusFiltered 使用 useMemo 避免重算', () => {
    const page = readPage();
    assert.ok(page.includes('statusFiltered'), '缺少 statusFiltered');
  });

  it('搜索下拉使用 searchTerm / setSearchTerm', () => {
    const page = readPage();
    assert.ok(page.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(page.includes('setSearchTerm'), '缺少 setSearchTerm');
  });

  it('Tabs 筛选使用 variant="pills" size="sm"', () => {
    const page = readPage();
    assert.ok(page.includes("variant=\"pills\""), '缺少 pills variant');
    assert.ok(page.includes("size=\"sm\""), '缺少 sm size');
  });

  it('DataTable 使用 striped 和 compact', () => {
    const page = readPage();
    assert.ok(page.includes('striped'), '缺少 striped');
    assert.ok(page.includes('compact'), '缺少 compact');
  });
});
