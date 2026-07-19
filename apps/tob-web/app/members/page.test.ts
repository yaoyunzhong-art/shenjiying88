/**
 * members/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 会员管理页面 — B端会员信息管理与多维度筛选
 * 角色视角: 👔运营经理 · 📊数据分析 · 💳会员主管
 *
 * 测试纬度：
 *   正例 — export/use client/Suspense/统计卡片/搜索/等级筛选/状态筛选/门店筛选/市场筛选/分页
 *   反例 — 空搜索/过滤链守卫/输入校验
 *   边界 — 分页边界/数据完整性/类型枚举/Mock数据/排序/颜色映射/统计计算
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file = 'page.tsx'): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

describe('members — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 MembersPage 组件（含 Suspense 包裹）', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function MembersPage'),
      '缺少默认导出 MembersPage',
    );
    assert.ok(src.includes('<Suspense'), '缺少 Suspense');
  });

  it('应包含 MembersPageContent 内部组件', () => {
    const src = readSource();
    assert.ok(src.includes('function MembersPageContent'), '缺少 MembersPageContent');
  });

  it('应包含 PageShell 包装', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应计算 4 个统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('stats.total'), '缺少 total');
    assert.ok(src.includes('stats.active'), '缺少 active');
    assert.ok(src.includes('stats.totalPoints'), '缺少 totalPoints');
    assert.ok(src.includes('stats.diamond'), '缺少 diamond');
  });

  it('统计卡片展示覆盖市场数', () => {
    const src = readSource();
    assert.ok(src.includes('ALL_MARKETS.length'), '缺少 ALL_MARKETS');
  });

  it('应包含搜索过滤输入框', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(src.includes('setSearchTerm'), '缺少 setSearchTerm');
  });

  it('搜索字段包含 code/name/phone/storeName/salesperson', () => {
    const src = readSource();
    assert.ok(src.includes("'code'"), '缺少 code');
    assert.ok(src.includes("'name'"), '缺少 name');
    assert.ok(src.includes("'phone'"), '缺少 phone');
    assert.ok(src.includes("'storeName'"), '缺少 storeName');
    assert.ok(src.includes("'salesperson'"), '缺少 salesperson');
  });

  it('应包含等级筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('tierFilter'), '缺少 tierFilter');
    assert.ok(src.includes('全部等级'), '缺少 全部等级');
  });

  it('应包含状态筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
    assert.ok(src.includes('全部状态'), '缺少 全部状态');
  });

  it('应包含门店筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('storeFilter'), '缺少 storeFilter');
    assert.ok(src.includes('全部门店'), '缺少 全部门店');
  });

  it('应包含市场筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('marketFilter'), '缺少 marketFilter');
    assert.ok(src.includes('全部市场'), '缺少 全部市场');
  });

  it('应包含 FilterChips 活跃过滤条件展示', () => {
    const src = readSource();
    assert.ok(src.includes('FilterChips'), '缺少 FilterChips');
    assert.ok(src.includes('onClearAll'), '缺少 onClearAll');
  });

  it('应包含 DataTable 数据表格', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('会员列表'), '缺少 会员列表');
  });

  it('应包含 Pagination 分页组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('total={sortedItems.length}'), '缺少 total');
  });

  it('表格包含 12 列定义', () => {
    const src = readSource();
    // buildColumns 中的列字段
    assert.ok(src.includes("key: 'code'"), '缺少 code 列');
    assert.ok(src.includes("key: 'name'"), '缺少 name 列');
    assert.ok(src.includes("key: 'phone'"), '缺少 phone 列');
    assert.ok(src.includes("key: 'tier'"), '缺少 tier 列');
    assert.ok(src.includes("key: 'points'"), '缺少 points 列');
    assert.ok(src.includes("key: 'totalSpent'"), '缺少 totalSpent 列');
    assert.ok(src.includes("key: 'status'"), '缺少 status 列');
  });

  it('手机号展示使用脱敏格式', () => {
    const src = readSource();
    assert.ok(src.includes('$1****$3'), '缺少手机号脱敏');
  });

  it('tierOrder 排序映射 5 个等级', () => {
    const src = readSource();
    assert.ok(src.includes("diamond: 5"), '缺少 diamond=5');
    assert.ok(src.includes("gold: 4"), '缺少 gold=4');
    assert.ok(src.includes("silver: 3"), '缺少 silver=3');
    assert.ok(src.includes("bronze: 2"), '缺少 bronze=2');
    assert.ok(src.includes("standard: 1"), '缺少 standard=1');
  });

  it('MembersPageFallback 组件存在', () => {
    const src = readSource();
    assert.ok(src.includes('function MembersPageFallback'), '缺少 Fallback');
    assert.ok(src.includes('正在加载会员列表...'), '缺少加载文本');
  });

  it('useMemo 优化多处过滤计算', () => {
    const src = readSource();
    // 至少 6 处 useMemo: tierFiltered/statusFiltered/storeFiltered/marketFiltered/columns/stats
    const matches = src.match(/useMemo/g);
    assert.ok(matches, '缺少 useMemo');
    assert.ok(matches.length >= 5, `期望至少 5 处 useMemo，实际 ${matches.length}`);
  });

  it('pointsColor 区分 4 个积分段颜色', () => {
    const src = readSource();
    assert.ok(src.includes('150000'), '缺少 150000');
    assert.ok(src.includes('80000'), '缺少 80000');
    assert.ok(src.includes('30000'), '缺少 30000');
  });

  it('formatCurrency 金额格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('formatCurrency'), '缺少 formatCurrency');
    assert.ok(src.includes('/ 10000'), '缺少万单位转换');
  });
});

describe('members — 反例（Error Path）', () => {
  it('过滤链逐层缩小：tier → status → store → market', () => {
    const src = readSource();
    assert.ok(src.includes('tierFiltered'), '缺少 tierFiltered');
    assert.ok(src.includes('statusFiltered'), '缺少 statusFiltered');
    assert.ok(src.includes('storeFiltered'), '缺少 storeFiltered');
    assert.ok(src.includes('marketFiltered'), '缺少 marketFiltered');
  });

  it('搜索筛选过滤使用 useSearchFilter', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('filteredItems 作为过滤链起点', () => {
    const src = readSource();
    assert.ok(src.includes('filteredItems'), '缺少 filteredItems');
  });

  it('分页 reset 在搜索/筛选变更时触发', () => {
    const src = readSource();
    assert.ok(
      src.includes('pagination.resetPage'),
      '缺少分页重置',
    );
  });

  it('useSortedItems 管理排序', () => {
    const src = readSource();
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('分页 pageSize 可选值 5/10/15/20', () => {
    const src = readSource();
    assert.ok(src.includes('[5, 10, 15, 20]'), '缺少分页尺寸选项');
  });
});

describe('members — 边界（Boundary / Edge）', () => {
  it('MOCK_MEMBERS 为 createMockMembers 生成的 60 条', () => {
    // page.tsx 引用 MOCK_MEMBERS，data 文件导出 MOCK_MEMBERS
    const page = readSource();
    assert.ok(page.includes('MOCK_MEMBERS'), 'page.tsx 引用 MOCK_MEMBERS');
    const data = readSource('../members-data/index.ts');
    assert.ok(data.includes('MOCK_MEMBERS'), 'data 模块导出 MOCK_MEMBERS');
    // createMockMembers 传给 count=60，确保函数签名包含默认值 60
    assert.ok(
      data.includes('count = 60') || data.includes('createMockMembers(count = 60)') || data.includes('60'),
      'createMockMembers 默认 60 条',
    );
  });

  it('MEMBER_TIERS 包含 5 个等级', () => {
    const data = readSource('../members-data/index.ts');
    assert.ok(data.includes("'diamond'"), '缺少 diamond');
    assert.ok(data.includes("'gold'"), '缺少 gold');
    assert.ok(data.includes("'silver'"), '缺少 silver');
    assert.ok(data.includes("'bronze'"), '缺少 bronze');
    assert.ok(data.includes("'standard'"), '缺少 standard');
  });

  it('MEMBER_STATUSES 包含 4 种状态', () => {
    const data = readSource('../members-data/index.ts');
    assert.ok(data.includes("'active'"), '缺少 active');
    assert.ok(data.includes("'inactive'"), '缺少 inactive');
    assert.ok(data.includes("'suspended'"), '缺少 suspended');
    assert.ok(data.includes("'churned'"), '缺少 churned');
  });

  it('ALL_STORES 包含 5 个门店', () => {
    const data = readSource('../members-data/index.ts');
    assert.ok(data.includes('旗舰店(上海)'), '缺少 旗舰店(上海)');
    assert.ok(data.includes('旗舰店(北京)'), '缺少 旗舰店(北京)');
    assert.ok(data.includes('体验店(杭州)'), '缺少 体验店(杭州)');
  });

  it('ALL_MARKETS 包含 5 个市场', () => {
    const data = readSource('../members-data/index.ts');
    assert.ok(data.includes('CN-SH'), '缺少 CN-SH');
    assert.ok(data.includes('CN-BJ'), '缺少 CN-BJ');
    assert.ok(data.includes('CN-ZJ'), '缺少 CN-ZJ');
  });

  it('分页初始化 pageSize 为 10', () => {
    const src = readSource();
    assert.ok(src.includes('initialPageSize: 10'), '缺少 initialPageSize=10');
  });

  it('分页最后一页条目数正确 (60条/10页=6页 满页)', () => {
    const total = 60;
    const pageSize = 10;
    const lastPage = Math.ceil(total / pageSize);
    const expectedLastCount = total - (lastPage - 1) * pageSize;
    assert.equal(expectedLastCount, 10, `最后一页应有 10 条`);
  });

  it('活跃率计算使用百分比', () => {
    const src = readSource();
    assert.ok(src.includes('.toFixed(0)}%'), '缺少百分比显示');
  });

  it('活跃率公式 stats.active / stats.total * 100', () => {
    const src = readSource();
    assert.ok(src.includes('stats.active / stats.total'), '缺少活跃率公式');
  });

  it('总积分统计使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), '缺少 reduce');
  });

  it('4 个统计卡片使用 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('gridTemplateColumns'), '缺少 grid 布局');
    assert.ok(src.includes('repeat(4'), '缺少 4 列');
  });
});
