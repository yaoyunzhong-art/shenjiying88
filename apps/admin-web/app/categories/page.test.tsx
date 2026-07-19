/**
 * categories/page.test.tsx — 分类管理列表页 L1 源码分析测试
 *
 * 覆盖: 页面结构 / 组件引用 / 数据流 / 过滤排序 / 统计面板 / 边界条件
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 *
 * 测试策略: 纯静态源码分析（node:test + readFileSync），不执行 JSX/Render
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE = resolve(import.meta.dirname, 'page.tsx');
const SRC = readFileSync(PAGE, 'utf-8');

// ── 辅助断言 ──
function assertIncludes(actual: string, expected: string, msg?: string): void {
  assert.ok(actual.includes(expected), msg ?? `expected source to include "${expected}"`);
}

function assertExcludes(actual: string, forbidden: string, msg?: string): void {
  assert.ok(!actual.includes(forbidden), msg ?? `expected source NOT to include "${forbidden}"`);
}

// ── 正向：页面结构与导出 ──
describe('categories/page — 页面结构与导出', () => {
  it('页面文件应存在', () => {
    assert.ok(existsSync(PAGE), 'page.tsx 文件缺失');
  });

  it('应包含 use client 指令', () => {
    assertIncludes(SRC, "'use client'");
  });

  it('应默认导出 CategoriesListPage', () => {
    assertIncludes(SRC, 'export default function CategoriesListPage');
  });

  it('导出应唯一（仅一个 export default）', () => {
    const matches = SRC.match(/export default /g);
    assert.equal(matches?.length, 1, `期望 1 个 export default，实际 ${matches?.length}`);
  });

  it('TSC 兼容：无 as any', () => {
    assertExcludes(SRC, 'as any');
  });
});

// ── 正向：UI 组件依赖 ──
describe('categories/page — UI 组件引用', () => {
  it('应引用 DataTable', () => {
    assertIncludes(SRC, 'DataTable');
  });

  it('应引用 Pagination', () => {
    assertIncludes(SRC, 'Pagination');
  });

  it('应引用 SearchFilterInput', () => {
    assertIncludes(SRC, 'SearchFilterInput');
  });

  it('应引用 StatusBadge', () => {
    assertIncludes(SRC, 'StatusBadge');
  });

  it('应引用 Tabs', () => {
    assertIncludes(SRC, 'Tabs');
  });

  it('应引用 PageShell', () => {
    assertIncludes(SRC, 'PageShell');
  });

  it('应引用 DetailActionBar', () => {
    assertIncludes(SRC, 'DetailActionBar');
  });
});

// ── 正向：Hooks 与状态管理 ──
describe('categories/page — Hooks 与性能优化', () => {
  it('应使用 useState 管理状态', () => {
    assertIncludes(SRC, 'useState');
    // 至少两个 useState（data, sortConfig, statusFilter, page）
    const useStateCalls = SRC.match(/useState\(/g);
    const useStateGenericCalls = SRC.match(/useState</g);
    const totalUseState = (useStateCalls?.length ?? 0) + (useStateGenericCalls?.length ?? 0);
    assert.ok(totalUseState >= 3, `useState 总调用次数 ${totalUseState} < 3`);
  });

  it('应使用 useMemo 缓存计算结果', () => {
    assertIncludes(SRC, 'useMemo');
  });

  it('应使用 useCallback 优化回调函数', () => {
    assertIncludes(SRC, 'useCallback');
  });

  it('应使用 useSearchFilter 实现搜索', () => {
    assertIncludes(SRC, 'useSearchFilter');
  });

  it('应使用 useSortedItems 实现排序', () => {
    assertIncludes(SRC, 'useSortedItems');
  });

  it('应使用 useRouter 进行路由跳转', () => {
    assertIncludes(SRC, 'useRouter');
  });
});

// ── 正向：数据流与过滤逻辑 ──
describe('categories/page — 数据流与过滤逻辑', () => {
  it('应引用 MOCK_CATEGORIES 作为初始化数据', () => {
    assertIncludes(SRC, 'MOCK_CATEGORIES');
  });

  it('应引用 CATEGORY_STATUS_MAP 用于状态映射', () => {
    assertIncludes(SRC, 'CATEGORY_STATUS_MAP');
  });

  it('应引用 computeCategoryStats 计算统计', () => {
    assertIncludes(SRC, 'computeCategoryStats');
  });

  it('搜索字段应覆盖 name, code, parentName', () => {
    assertIncludes(SRC, "'name', 'code', 'parentName'", '搜索字段应包含 name, code, parentName');
  });

  it('Tabs 过滤应支持 all, root, leaf 三种模式', () => {
    assertIncludes(SRC, "'all'");
    assertIncludes(SRC, "'root'");
    assertIncludes(SRC, "'leaf'");
  });

  it('root 过滤应筛选无 parentName 的分类', () => {
    assertIncludes(SRC, "!i.parentName");
  });

  it('leaf 过滤应筛选有 parentName 的子分类', () => {
    assertIncludes(SRC, "i.parentName");
  });
});

// ── 正向：列定义与渲染 ──
describe('categories/page — 表格列定义', () => {
  it('应包含分类名称列（name）', () => {
    assertIncludes(SRC, "key: 'name'");
  });

  it('应包含编码列（code）', () => {
    assertIncludes(SRC, "key: 'code'");
  });

  it('应包含上级分类列（parentName）', () => {
    assertIncludes(SRC, "key: 'parentName'");
  });

  it('应包含商品数列（productCount）', () => {
    assertIncludes(SRC, "key: 'productCount'");
  });

  it('应包含状态列（status）', () => {
    assertIncludes(SRC, "key: 'status'");
  });

  it('应包含排序列（sortOrder）', () => {
    assertIncludes(SRC, "key: 'sortOrder'");
  });

  it('应包含创建时间列（createdAt）', () => {
    assertIncludes(SRC, "key: 'createdAt'");
  });

  it('所有列应可排序（sortable: true）', () => {
    const sortableCounts = SRC.match(/sortable: true/g);
    assert.ok(sortableCounts && sortableCounts.length >= 5, `sortable 列不足: ${sortableCounts?.length}`);
  });

  it('名称列应包含点击跳转的 onClick 处理', () => {
    assertIncludes(SRC, 'onRowClick(item)');
  });
});

// ── 边界：分页与空状态 ──
describe('categories/page — 分页与空状态边界', () => {
  it('pageSize 应配置为 10', () => {
    assertIncludes(SRC, 'pageSize = 10');
  });

  it('应实现切片分页逻辑', () => {
    assertIncludes(SRC, '.slice(');
  });

  it('空数据时应显示 emptyText', () => {
    assertIncludes(SRC, 'emptyText');
  });

  it('空状态文案应为 "暂无分类数据"', () => {
    assertIncludes(SRC, '暂无分类数据');
  });

  it('应包含 Pagination 组件且传入 page / total / onPageChange', () => {
    assertIncludes(SRC, '<Pagination');
    assertIncludes(SRC, 'page={page}');
    assertIncludes(SRC, 'total={total}');
    assertIncludes(SRC, 'onPageChange={setPage}');
  });
});

// ── 边界：状态切换与动作 ──
describe('categories/page — 状态切换与动作处理', () => {
  it('statusFilter 应支持切换后重置分页到第 1 页', () => {
    assertIncludes(SRC, 'setPage(1)');
  });

  it('新建分类操作应跳转到 /new 路径', () => {
    assertIncludes(SRC, "'add'");
    assertIncludes(SRC, '/new', '应包含 /new 路径');
    assertIncludes(SRC, '新建分类');
  });

  it('行点击应跳转到分类详情页', () => {
    assertIncludes(SRC, 'router.push');
    assertIncludes(SRC, 'detailHrefBase');
  });
});

// ── 正向：统计面板 ──
describe('categories/page — 统计面板', () => {
  it('应导出 CategoryStatsPanel 组件', () => {
    assertIncludes(SRC, 'CategoryStatsPanel');
  });

  it('统计面板应显示总分类数', () => {
    assertIncludes(SRC, 'stats.total');
  });

  it('统计面板应显示一级分类数（rootCount）', () => {
    assertIncludes(SRC, 'stats.rootCount');
  });

  it('统计面板应显示关联商品总数', () => {
    assertIncludes(SRC, 'stats.totalProducts');
  });

  it('统计面板应显示启用/停用数据', () => {
    assertIncludes(SRC, '.filter(i => i.status === \'active\')');
    assertIncludes(SRC, '.filter(i => i.status === \'inactive\')');
  });

  it('统计面板应包含启用/停用分布可视化条', () => {
    assertIncludes(SRC, 'gridColumn: \'1 / -1\'', '分布可视化应在最后一行');
    assertIncludes(SRC, '启用', '分布可视化应标出启用');
    assertIncludes(SRC, '停用', '分布可视化应标出停用');
  });

  it('stats 计算应依赖 useMemo', () => {
    // 在组件内部 computeCategoryStats 应包裹 useMemo
    const lines = SRC.split('\n');
    const memoLines = lines.filter(l => l.includes('useMemo') && l.includes('computeCategoryStats'));
    assert.ok(memoLines.length >= 1, 'computeCategoryStats 应包裹在 useMemo 中');
  });
});

// ── 防御：安全与代码质量 ──
describe('categories/page — 安全与代码质量', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assertExcludes(SRC, 'dangerouslySetInnerHTML');
  });

  it('不应使用 console.log 调试', () => {
    // 允许 console 出现在注释中
    const codeLines = SRC.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const consoleLogLines = codeLines.filter(l => l.includes('console.log'));
    assert.equal(consoleLogLines.length, 0, '不应在运行时代码中使用 console.log');
  });

  it('不应使用已废弃的生命周期方法', () => {
    assertExcludes(SRC, 'componentWillMount');
    assertExcludes(SRC, 'componentWillReceiveProps');
    assertExcludes(SRC, 'componentWillUpdate');
  });
});

// ── 集成：组件间交互 ──
describe('categories/page — 组件交互集成', () => {
  it('搜索和分页应协同工作（通过 filteredItems 串联）', () => {
    assertIncludes(SRC, 'filteredItems');
    assertIncludes(SRC, 'displayData');
  });

  it('排序配置变化应通过 onSortChange 传递', () => {
    assertIncludes(SRC, 'onSortChange=');
    assertIncludes(SRC, 'setSortConfig');
  });

  it('DataTable 应接收 rowKey / sort / onRowClick', () => {
    assertIncludes(SRC, 'rowKey=');
    assertIncludes(SRC, 'sort={sortConfig}');
    assertIncludes(SRC, 'onRowClick=');
  });

  it('Tabs 应接收 activeKey / onChange', () => {
    assertIncludes(SRC, 'activeKey={statusFilter');
    assertIncludes(SRC, 'onChange={handleStatusFilter}');
  });

  it('PageShell 应接收 title / subtitle / actions', () => {
    assertIncludes(SRC, 'title=');
    assertIncludes(SRC, 'subtitle=');
    assertIncludes(SRC, 'actions=');
  });

  it('emptyText 应通过 DT prop 传入', () => {
    // emptyText 在同一 JSX 块中被引用为 DataTable 的属性
    assertIncludes(SRC, 'emptyText="暂无分类数据"');
  });
});

// ── 边界：分类数据依赖 ──
describe('categories/page — 数据依赖契约', () => {
  it('应从 categories-data 导入 CategoryItem 类型', () => {
    assertIncludes(SRC, 'CategoryItem');
  });

  it('应从 categories-data 导入 adminCategoryRoute', () => {
    assertIncludes(SRC, 'adminCategoryRoute');
  });

  it('应从 categories-data 导入 MOCK_CATEGORIES', () => {
    assertIncludes(SRC, 'MOCK_CATEGORIES');
  });

  it('应从 categories-data 导入 CATEGORY_STATUS_MAP', () => {
    assertIncludes(SRC, 'CATEGORY_STATUS_MAP');
  });

  it('import 来自 "../categories-data"', () => {
    assertIncludes(SRC, '../categories-data');
  });

  it('buildColumns 函数应返回 DataTableColumn<CategoryItem>[] 类型', () => {
    assertIncludes(SRC, 'DataTableColumn<CategoryItem>[]');
  });
});
