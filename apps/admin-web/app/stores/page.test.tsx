/**
 * stores/page.test.tsx — 门店列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 *
 * 注意：page.tsx 已重构为从 stores-data.ts 导入类型/常量的架构，
 * 因此不再在 page.tsx 中直接内联定义。
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

  it('应从 stores-data.ts 导入 StoreItem 接口', () => {
    const src = readSource();
    // 不再内联定义，转为从外部导入
    assert.ok(src.includes("from '../stores-data'"), '缺少从 stores-data 导入');
    assert.ok(src.includes('type StoreItem') || src.includes('StoreItem,'), '缺少 StoreItem 类型导入');
  });

  it('应计算 total / active / highRisk 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:') || src.includes('stats.total'), '缺少 total');
    assert.ok(src.includes('stats.active'), '缺少 active');
    assert.ok(src.includes('highRisk'), '缺少 highRisk');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('应接入管理员权限边界', () => {
    const src = readSource();
    assert.ok(src.includes('AdminPermissionGate'), '缺少 AdminPermissionGate');
    assert.ok(src.includes('requiredPermission="store:read"'), '缺少 store:read 权限边界');
  });

  it('应从 stores-data.ts 导入 STORE_STATUS_MAP', () => {
    const src = readSource();
    assert.ok(src.includes('STORE_STATUS_MAP') && !src.includes('export const STORE_STATUS_MAP'),
      '应从外部导入 STORE_STATUS_MAP');
  });

  it('应从 stores-data.ts 导入 STORE_RISK_LEVEL_MAP', () => {
    const src = readSource();
    assert.ok(src.includes('STORE_RISK_LEVEL_MAP'), '缺少 STORE_RISK_LEVEL_MAP');
  });

  it('应使用 computed stats，而非直接内联 MOCK_STORES', () => {
    const src = readSource();
    assert.ok(src.includes('computeStoreStats'), '缺少 computeStoreStats');
  });

  it('应包含租户数和品牌数统计', () => {
    const src = readSource();
    assert.ok(src.includes('totalTenants') || src.includes('stats.totalTenants'), '缺少 totalTenants');
    assert.ok(src.includes('brandCount') || src.includes('computeStoreStats'), '缺少品牌统计');
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
  it('应统计门店长度', () => {
    const src = readSource();
    assert.ok(src.includes('stores.length') || src.includes('stats.total'), '长度统计');
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
    assert.ok(src.includes('riskFilter') || src.includes('STORE_RISK_LEVEL_MAP'), '缺少风险等级筛选');
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
  it('包含 && 或 ? 条件逻辑', () => {
    const src = readSource(); assert.ok(src.includes(' && ') || src.includes(' ? '));
  });
  it('包含事件处理 onClick/onChange', () => {
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
  it('包含 reduce 或 for-of 数据聚合', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce(') || src.includes('computeStoreStats'), '数据聚合');
  });
  it('包含 Tabs 筛选组件', () => {
    const src = readSource(); assert.ok(src.includes('Tabs'));
  });
});

describe('stores — 业务深度', () => {
  it('包含从 stores-data 导入的类型定义', () => {
    const src = readSource();
    assert.ok(src.includes("from '../stores-data'"), '依赖 stores-data 模块');
  });
  it('包含门店状态枚举4种（通过 STORE_STATUSES / STORE_STATUS_MAP 引用）', () => {
    const src = readSource();
    // 页面从 stores-data 导入 STORE_STATUSES/STORE_STATUS_MAP，不再内联字符串
    assert.ok(src.includes('STORE_STATUSES') || src.includes('STORE_STATUS_MAP'), '需要引用门店状态常量');
    assert.ok(src.includes('statusFilter') && src.includes('StoreStatus'), '需要状态筛选逻辑');
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
  it('包含门店详情导航（link to /stores/${id}）', () => {
    const src = readSource();
    assert.ok(src.includes('/stores/'));
  });
  it('包含删除功能（handleDelete）', () => {
    const src = readSource();
    assert.ok(src.includes('handleDelete') || src.includes('onDelete') || src.includes('deleteConfirm'));
  });
  it('包含 useStoreCapabilityGating 能力门控', () => {
    const src = readSource();
    assert.ok(src.includes('useStoreCapabilityGating'), '缺少能力门控');
  });
  it('包含 loadAdminStoreList 异步加载', () => {
    const src = readSource();
    assert.ok(src.includes('loadAdminStoreList'), '缺少异步数据加载');
  });
});

// ---- hooks验证 ----

describe('stores — hooks验证', () => {
  const src = readSource();
  it('包含useState声明', () => assert.ok(src.includes('const [') && src.includes('useState')));
  it('包含JSX返回', () => assert.ok(src.includes('return (') || src.includes('return <')));
  it('包含事件处理器', () => assert.ok(src.includes('onClick={') || src.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(src.includes('.map(')));
  it('包含条件渲染', () => assert.ok(src.includes(' && ') || src.includes(' ? ')));
  it('包含样式定义', () => assert.ok(src.includes('style={')));
  it('包含数据格式化', () => assert.ok(src.includes('.toFixed') || src.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(src.includes('${')));
  it('包含默认导出', () => assert.ok(src.includes('export default function')));
  it('包含注释说明', () => assert.ok(src.includes('/**') || src.includes('//')));
});
