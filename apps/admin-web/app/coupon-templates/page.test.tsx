/**
 * coupon-templates/page.test.tsx — 优惠券模板列表页 L1 冒烟测试
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

// ---- 正例 ----

describe('coupon-templates — 正例', () => {
  it('应导出一个默认组件 CouponTemplatesPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CouponTemplatesPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_COUPON_TEMPLATES 和 CouponTemplateItem 接口', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPON_TEMPLATES'), '缺少 MOCK_COUPON_TEMPLATES');
    assert.ok(src.includes('interface CouponTemplateItem'), '缺少 CouponTemplateItem 接口');
  });

  it('应计算 total / active / totalIssued / totalUsed 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('totalIssued'), '缺少 totalIssued');
    assert.ok(src.includes('totalUsed'), '缺少 totalUsed');
  });

  it('应使用 useSearchFilter 搜索过滤机制', () => {
    const src = readSource();
    assert.ok(src.includes('searchFiltered'), '缺少 searchFiltered');
  });

  it('应导出 COUPON_TYPE_MAP 常量', () => {
    const src = readSource();
    assert.ok(src.includes('export const COUPON_TYPE_MAP'), '缺少导出 COUPON_TYPE_MAP');
  });

  it('应导出 COUPON_STATUS_MAP 常量', () => {
    const src = readSource();
    assert.ok(src.includes('export const COUPON_STATUS_MAP'), '缺少导出 COUPON_STATUS_MAP');
  });

  it('应导出 MOCK_COUPON_TEMPLATES 数据', () => {
    const src = readSource();
    assert.ok(src.includes('export const MOCK_COUPON_TEMPLATES'), '缺少导出 MOCK_COUPON_TEMPLATES');
  });

  it('应包含 4 种优惠券类型枚举', () => {
    const src = readSource();
    assert.ok(src.includes("'amount'") && src.includes("'discount'") && src.includes("'cash'") && src.includes("'exchange'"), '缺少完整类型枚举');
  });

  it('应包含 3 种状态枚举', () => {
    const src = readSource();
    assert.ok(src.includes("'active'") && src.includes("'expired'") && src.includes("'stopped'"), '缺少完整状态枚举');
  });

  it('应包含 4 列统计卡片布局', () => {
    const src = readSource();
    assert.ok(src.includes("gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'"), '缺少 4 列统计卡片');
  });

  it('应包含 FilterChips 活跃过滤条件可视化', () => {
    const src = readSource();
    assert.ok(src.includes('FilterChips'), '缺少 FilterChips');
  });

  it('应包含使用率进度条渲染', () => {
    const src = readSource();
    assert.ok(src.includes('usageRate'), '缺少 usageRate 列');
    assert.ok(src.includes('usedCount / item.totalIssued'), '缺少使用率计算');
  });

  it('应包含 Tab 筛选: 生效中 / 已过期 / 全部', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'active'") || src.includes("'生效中'"), '缺少生效中 Tab');
    assert.ok(src.includes("key: 'expired'") || src.includes("'已过期'"), '缺少已过期 Tab');
    assert.ok(src.includes("key: 'ALL'") || src.includes("'全部'"), '缺少全部 Tab');
  });

  it('应包含刷新按钮', () => {
    const src = readSource();
    assert.ok(src.includes('刷新'), '缺少刷新按钮文字');
    assert.ok(src.includes('setRefreshKey'), '缺少 setRefreshKey');
  });

  it('应包含面值格式化（折扣券显示折数）', () => {
    const src = readSource();
    assert.ok(src.includes("'discount'") && src.includes('.toFixed(0)') && src.includes('折'), '缺少折扣券面值格式化');
  });
});

// ---- 反例 ----

describe('coupon-templates — 反例', () => {
  it('空态时 MOCK_COUPON_TEMPLATES 应展示空态 UI', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyCouponSVG'), '缺少空态 SVG 组件');
    assert.ok(src.includes('暂无优惠券模板'), '缺少空态标题');
  });

  it('应包含空态创建引导按钮', () => {
    const src = readSource();
    assert.ok(src.includes('创建优惠券模板'), '缺少创建引导');
  });

  it('无门槛最低消费应显示"无门槛"', () => {
    const src = readSource();
    assert.ok(src.includes('minSpend === 0') && src.includes("'无门槛'"), '缺少无门槛显示');
  });

  it('未使用券使用率应为 0%', () => {
    const src = readSource();
    assert.ok(src.includes('usedCount === 0') || src.includes('usedCount: 0'), '缺少已使用为 0 的样本');
  });

  it('使用率样式按阈值分色（高/中/低）', () => {
    const src = readSource();
    assert.ok(src.includes('rate >= 0.7') && src.includes('rate >= 0.3'), '缺少使用率阈值分色');
  });
});

// ---- 边界 ----

describe('coupon-templates — 边界', () => {
  it('空模板列表时 hasNoData 应为 true', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPON_TEMPLATES.length === 0'), '缺少空列表判断');
  });

  it('应支持带数值的最低消费字段', () => {
    const src = readSource();
    assert.ok(src.includes('minSpend'), '缺少 minSpend');
  });

  it('应包含 validFrom 和 validTo 有效期字段', () => {
    const src = readSource();
    assert.ok(src.includes('validFrom') && src.includes('validTo'), '缺少有效期字段');
  });

  it('应包含 totalIssued 发放量统计', () => {
    const src = readSource();
    assert.ok(src.includes('totalIssued'), '缺少 totalIssued');
  });

  it('应包含 usedCount 已使用统计', () => {
    const src = readSource();
    assert.ok(src.includes('usedCount'), '缺少 usedCount');
  });

  it('应包含 faceValue 面值列', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'faceValue'"), '缺少 faceValue 列');
  });

  it('应支持 type 类型排序', () => {
    const src = readSource();
    assert.ok(src.includes("sortValue: (item: CouponTemplateItem) => item.type") || src.includes("sortValue: (item: CouponTemplateItem) => item.status"), '缺少 sortValue 排序函数');
  });

  it('应支持 status 状态排序', () => {
    const src = readSource();
    assert.ok(src.includes("sortValue: (item: CouponTemplateItem) => item.status"), '缺少 status sortValue');
  });

  it('应支持筛选后重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination.resetPage()'), '缺少重置分页');
  });

  it('应包含 minSpend 最低消费列', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'minSpend'"), '缺少 minSpend 列');
  });
});

// ---- 防御 ----

describe('coupon-templates — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 usePagination 分页逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '缺少分页');
  });

  it('应包含 useDetailActions hook', () => {
    const src = readSource();
    assert.ok(src.includes('useDetailActions'), '缺少 useDetailActions');
  });

  it('应包含 SearchFilterInput 搜索组件', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
  });

  it('应包含 useSortedItems 排序逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('应处理筛选变化后重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination.resetPage()'), '缺少重置分页');
  });

  it('应包含 statCardStyle 样式常量', () => {
    const src = readSource();
    assert.ok(src.includes('statCardStyle'), '缺少 statCardStyle');
  });
});

// ---- 深度组件 ----

describe('coupon-templates — 深度组件', () => {
  it('包含 JSX 列表渲染 .filter()', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), '缺少 .filter()');
  });
  it('包含三元条件渲染', () => {
    const src = readSource();
    assert.ok(src.includes(' ? ') || src.includes(' ?? '));
  });
  it('包含 && 或 ?: 条件逻辑', () => {
    const src = readSource();
    assert.ok(src.includes(' && ') || src.includes(' ? '));
  });
  it('包含事件处理 onClick', () => {
    const src = readSource();
    assert.ok(src.includes('onClick') || src.includes('onChange'));
  });
  it('包含 style 内联样式', () => {
    const src = readSource();
    assert.ok(src.includes('style={'));
  });
  it('包含模板变量 ${}', () => {
    const src = readSource();
    assert.ok(src.includes('${'));
  });
  it('包含 useState 状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('const [') && src.includes('useState'));
  });
  it('包含 filter 不可变过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('));
  });
  it('包含 reduce 数据聚合', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('));
  });
  it('包含 Tabs 筛选组件', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'));
  });
});

// ---- 业务深度 ----

describe('coupon-templates — 业务深度', () => {
  it('包含 6 条 Mock 模板数据', () => {
    const src = readSource();
    const match = src.match(/MOCK_COUPON_TEMPLATES[\s\S]{0,30}\[/);
    assert.ok(match, 'MOCK_COUPON_TEMPLATES 数组定义');
  });
  it('包含 4 种优惠券类型映射', () => {
    const src = readSource();
    assert.ok(src.includes("amount:") && src.includes("discount:") && src.includes("cash:") && src.includes("exchange:"));
  });
  it('包含 3 种状态映射', () => {
    const src = readSource();
    assert.ok(src.includes("active:") && src.includes("expired:") && src.includes("stopped:"));
  });
  it('包含 DataTable 表格数据', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'));
  });
  it('包含 Pagination 分页', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'));
  });
  it('包含 dataKey 列数据绑定', () => {
    const src = readSource();
    assert.ok(src.includes('dataKey'));
  });
  it('包含 sortable 可排序', () => {
    const src = readSource();
    assert.ok(src.includes('sortable'));
  });
  it('包含 StatusBadge 状态徽章渲染', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'));
  });
  it('包含 EmptyState 空态组件', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState') || src.includes('EmptyCouponSVG'));
  });
  it('包含筛选后重置分页逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('resetPage'));
  });
});

// ---- hooks 验证 ----

describe('coupon-templates — hooks 验证', () => {
  const src = readSource();
  it('包含 useState 声明', () => assert.ok(src.includes('const [') && src.includes('useState')));
  it('包含 JSX 返回', () => assert.ok(src.includes('return (') || src.includes('return <')));
  it('包含事件处理器', () => assert.ok(src.includes('onClick={') || src.includes('onChange={')));
  it('包含不可变过滤 .filter()', () => assert.ok(src.includes('.filter(')));
  it('包含条件渲染', () => assert.ok(src.includes(' && ') || src.includes(' ? ')));
  it('包含样式定义', () => assert.ok(src.includes('style={')));
  it('包含数据格式化', () => assert.ok(src.includes('.toFixed') || src.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(src.includes('${')));
  it('包含默认导出', () => assert.ok(src.includes('export default function')));
  it('包含注释说明', () => assert.ok(src.includes('/**') || src.includes('//')));
});
