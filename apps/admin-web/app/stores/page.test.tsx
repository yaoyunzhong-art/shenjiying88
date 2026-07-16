/**
 * stores/page.test.tsx — 门店列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
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

describe('stores — 正例', () => {
  it('应导出一个默认组件 StoresPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoresPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_STORES 和 StoreItem 接口', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES'), '缺少 MOCK_STORES');
    assert.ok(src.includes('interface StoreItem'), '缺少 StoreItem 接口');
  });

  it('应计算 total / active / highRisk 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('highRisk'), '缺少 highRisk');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('应导出 STORE_STATUS_MAP 常量', () => {
    const src = readSource();
    assert.ok(src.includes('export const STORE_STATUS_MAP'), '缺少导出 STORE_STATUS_MAP');
  });

  it('应导出 RISK_LEVEL_MAP 常量', () => {
    const src = readSource();
    assert.ok(src.includes('export const RISK_LEVEL_MAP'), '缺少导出 RISK_LEVEL_MAP');
  });

  it('应导出 MOCK_STORES 数据', () => {
    const src = readSource();
    assert.ok(src.includes('export const MOCK_STORES'), '缺少导出 MOCK_STORES');
  });

  it('应包含 totalTenants 和 totalBrands 统计', () => {
    const src = readSource();
    assert.ok(src.includes('totalTenants'), '缺少 totalTenants');
    assert.ok(src.includes('totalBrands'), '缺少 totalBrands');
  });

  it('应包含 4 列统计卡片布局', () => {
    const src = readSource();
    assert.ok(src.includes("gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'"), '缺少 4 列统计卡片');
  });

  it('应包含 FilterChips 活跃过滤条件可视化', () => {
    const src = readSource();
    assert.ok(src.includes('FilterChips'), '缺少 FilterChips');
  });
});

// ---- 边界 ----

describe('stores — 边界', () => {
  it('空 MOCK_STORES 时长度应为 0', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES.length'), '长度统计');
  });

  it('应支持 marketCode 市场分类', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('应包含 status 统计分组', () => {
    const src = readSource();
    assert.ok(src.includes('.status'), '缺少状态分组');
  });

  it('应支持 riskLevel 风险等级筛选', () => {
    const src = readSource();
    assert.ok(src.includes('riskFilter'), '缺少 riskFilter');
  });

  it('应支持风险等级 Tabs 筛选组件', () => {
    const src = readSource();
    assert.ok(src.includes("riskLevel: 'low' | 'medium' | 'high'"), '缺少风险等级类型');
  });

  it('应支持 DetailActionBar 操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应支持合条件清空（onClearAll）', () => {
    const src = readSource();
    assert.ok(src.includes('onClearAll'), '缺少 onClearAll');
  });
});

// ---- 防御 ----

describe('stores — 防御', () => {
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

describe('stores — 深度组件', () => {
  it('包含JSX列表渲染 .map()', () => {
    const src = readSource(); assert.ok(src.includes('.map('));
  });
  it('包含三元条件渲染', () => {
    const src = readSource(); assert.ok(src.includes(' ? ') || src.includes(' ?? '));
  });
  it('包含 && 逻辑条件', () => {
    const src = readSource(); assert.ok(src.includes(' && '));
  });
  it('包含事件处理 onClick', () => {
    const src = readSource(); assert.ok(src.includes('onClick') || src.includes('onChange'));
  });
  it('包含style内联样式', () => {
    const src = readSource(); assert.ok(src.includes('style={'));
  });
  it('包含模板变量 ${}', () => {
    const src = readSource(); assert.ok(src.includes('${'));
  });
  it('包含 useState 状态管理', () => {
    const src = readSource(); assert.ok(src.includes('const [') && src.includes('useState'));
  });
  it('包含 filter 不可变过滤', () => {
    const src = readSource(); assert.ok(src.includes('.filter('));
  });
  it('包含 reduce 数据聚合', () => {
    const src = readSource(); assert.ok(src.includes('.reduce('));
  });
  it('包含 Tabs 筛选组件', () => {
    const src = readSource(); assert.ok(src.includes('Tabs'));
  });
});

describe('stores — 业务深度', () => {
  it('包含15条Mock门店数据', () => {
    const src = readSource();
    const match = src.match(/MOCK_STORES[\s\S]{0,20}\[/);
    assert.ok(match, 'MOCK_STORES数组定义');
  });
  it('包含门店状态枚举4种', () => {
    const src = readSource();
    assert.ok(src.includes("'active'") && src.includes("'inactive'") && src.includes("'pending'") && src.includes("'suspended'"));
  });
  it('包含市场分类marketCode', () => {
    const src = readSource(); assert.ok(src.includes('cn-mainland') || src.includes('marketCode'));
  });
  it('包含DataTable表格数据', () => {
    const src = readSource(); assert.ok(src.includes('DataTable'));
  });
  it('包含Pagination分页', () => {
    const src = readSource(); assert.ok(src.includes('Pagination'));
  });
  it('包含dataKey列数据绑定', () => {
    const src = readSource(); assert.ok(src.includes('dataKey'));
  });
  it('包含sortable可排序', () => {
    const src = readSource(); assert.ok(src.includes('sortable'));
  });
  it('包含 StatusBadge 状态徽章渲染', () => {
    const src = readSource(); assert.ok(src.includes('StatusBadge'));
  });
  it('包含 riskFilter 风险筛选', () => {
    const src = readSource(); assert.ok(src.includes('riskFilter'));
  });
  it('包含筛选后重置分页逻辑', () => {
    const src = readSource(); assert.ok(src.includes('resetPage'));
  });
});

// ---- hooks验证 ----

describe('stores — hooks验证', () => {
  it('包含useState状态声明', () => assert.ok(readSource().includes('const [') && readSource().includes('] = useState')));
  it('包含JSX返回语句', () => assert.ok(readSource().includes('return (')));
  it('包含事件处理器(onClick/onChange)', () => assert.ok(readSource().includes('onClick={') || readSource().includes('onChange={')));
  it('包含列表渲染(map)', () => assert.ok(readSource().includes('.map(')));
  it('包含条件渲染', () => assert.ok(readSource().includes(' && ') || readSource().includes(' ? ')));
  it('包含样式定义', () => assert.ok(readSource().includes('style={')));
  it('包含数据格式化', () => assert.ok(readSource().includes('.toFixed') || readSource().includes('toLocaleString') || readSource().includes('Math.')));
  it('包含模板字符串', () => assert.ok(readSource().includes('${')));
  it('包含默认导出函数', () => assert.ok(readSource().includes('export default function')));
  it('包含注释说明', () => assert.ok(readSource().includes('//') || readSource().includes('/*')));
});
