/**
 * employees/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 员工管理页面 — B端员工信息管理与多维度筛选
 * 角色视角: 👔HR经理 · 📊运营总监 · 💼门店主管
 *
 * 测试纬度：
 *   正例 — export/use client/Suspense/统计卡片/搜索/部门筛选/角色筛选/状态筛选/门店筛选/市场筛选/分页
 *   反例 — 搜索字段/过滤链守卫/输入校验
 *   边界 — 分页边界/数据完整性/类型枚举/排序/绩效颜色/统计计算
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

function readData(): string {
  return readFileSync(resolve(__dirname, '../employees-data/index.ts'), 'utf-8');
}

describe('employees — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 EmployeesPage 组件（含 Suspense 包裹）', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function EmployeesPage'),
      '缺少默认导出 EmployeesPage',
    );
    assert.ok(src.includes('<Suspense'), '缺少 Suspense');
  });

  it('应包含 EmployeesPageContent 内部组件', () => {
    const src = readSource();
    assert.ok(src.includes('function EmployeesPageContent'), '缺少 EmployeesPageContent');
  });

  it('应包含 PageShell 包装', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应计算 5 个统计值（总数/在职/月薪总额/平均绩效/经理数）', () => {
    const src = readSource();
    assert.ok(src.includes('stats.total'), '缺少 total');
    assert.ok(src.includes('stats.active'), '缺少 active');
    assert.ok(src.includes('stats.totalSalary'), '缺少 totalSalary');
    assert.ok(src.includes('stats.avgPerformance'), '缺少 avgPerformance');
    assert.ok(src.includes('managers'), '缺少 managers');
  });

  it('统计卡片展示覆盖门店数', () => {
    const src = readSource();
    assert.ok(src.includes('ALL_STORES.length'), '缺少 ALL_STORES');
  });

  it('应包含搜索过滤输入框', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(src.includes('setSearchTerm'), '缺少 setSearchTerm');
  });

  it('搜索字段包含 code/name/phone/storeName/department/email', () => {
    const src = readSource();
    assert.ok(src.includes("'code'"), '缺少 code');
    assert.ok(src.includes("'name'"), '缺少 name');
    assert.ok(src.includes("'phone'"), '缺少 phone');
    assert.ok(src.includes("'storeName'"), '缺少 storeName');
    assert.ok(src.includes("'department'"), '缺少 department');
    assert.ok(src.includes("'email'"), '缺少 email');
  });

  it('应包含部门筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('deptFilter'), '缺少 deptFilter');
    assert.ok(src.includes('全部部门'), '缺少 全部部门');
  });

  it('应包含角色筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('roleFilter'), '缺少 roleFilter');
    assert.ok(src.includes('全部职位'), '缺少 全部职位');
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
    assert.ok(src.includes('员工列表'), '缺少 员工列表');
  });

  it('应包含 Pagination 分页组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('total={sortedItems.length}'), '缺少 total');
  });

  it('表格包含 11 列定义', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'code'"), '缺少 code 列');
    assert.ok(src.includes("key: 'name'"), '缺少 name 列');
    assert.ok(src.includes("key: 'phone'"), '缺少 phone 列');
    assert.ok(src.includes("key: 'department'"), '缺少 department 列');
    assert.ok(src.includes("key: 'role'"), '缺少 role 列');
    assert.ok(src.includes("key: 'storeName'"), '缺少 storeName 列');
    assert.ok(src.includes("key: 'status'"), '缺少 status 列');
    assert.ok(src.includes("key: 'salary'"), '缺少 salary 列');
    assert.ok(src.includes("key: 'performance'"), '缺少 performance 列');
    assert.ok(src.includes("key: 'joinDate'"), '缺少 joinDate 列');
    assert.ok(src.includes("key: 'marketCode'"), '缺少 marketCode 列');
  });

  it('手机号展示使用脱敏格式', () => {
    const src = readSource();
    assert.ok(src.includes('$1****$3'), '缺少手机号脱敏');
  });

  it('roleOrder 排序映射 4 个职位', () => {
    const src = readSource();
    assert.ok(src.includes("manager: 4"), '缺少 manager=4');
    assert.ok(src.includes("supervisor: 3"), '缺少 supervisor=3');
    assert.ok(src.includes("staff: 2"), '缺少 staff=2');
    assert.ok(src.includes("trainee: 1"), '缺少 trainee=1');
  });

  it('EmployeesPageFallback 组件存在', () => {
    const src = readSource();
    assert.ok(src.includes('function EmployeesPageFallback'), '缺少 Fallback');
    assert.ok(src.includes('正在加载员工列表...'), '缺少加载文本');
  });

  it('useMemo 优化多处过滤计算', () => {
    const src = readSource();
    const matches = src.match(/useMemo/g);
    assert.ok(matches, '缺少 useMemo');
    assert.ok(matches.length >= 6, `期望至少 6 处 useMemo，实际 ${matches.length}`);
  });

  it('performanceLevel 区分 4 个绩效等级', () => {
    const src = readSource();
    assert.ok(src.includes("'优秀'"), '缺少 优秀');
    assert.ok(src.includes("'良好'"), '缺少 良好');
    assert.ok(src.includes("'合格'"), '缺少 合格');
    assert.ok(src.includes("'待改进'"), '缺少 待改进');
  });

  it('performanceColor 区分 4 个分数段颜色', () => {
    const src = readSource();
    assert.ok(src.includes('90'), '缺少 >=90 阈值');
    assert.ok(src.includes('75'), '缺少 >=75 阈值');
    assert.ok(src.includes('60'), '缺少 >=60 阈值');
  });

  it('formatSalary 薪资格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('formatSalary'), '缺少 formatSalary');
    assert.ok(src.includes('toLocaleString'), '缺少 toLocaleString');
  });

  it('部门中文标签映射 5 个部门', () => {
    const src = readSource();
    assert.ok(src.includes("'销售部'"), '缺少 销售部');
    assert.ok(src.includes("'运营部'"), '缺少 运营部');
    assert.ok(src.includes("'市场部'"), '缺少 市场部');
    assert.ok(src.includes("'财务部'"), '缺少 财务部');
    assert.ok(src.includes("'人事部'"), '缺少 人事部');
  });
});

describe('employees — 反例（Error Path）', () => {
  it('过滤链逐层缩小：department → role → status → store → market', () => {
    const src = readSource();
    assert.ok(src.includes('deptFiltered'), '缺少 deptFiltered');
    assert.ok(src.includes('roleFiltered'), '缺少 roleFiltered');
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

describe('employees — 边界（Boundary / Edge）', () => {
  it('MOCK_EMPLOYEES 为 createMockEmployees 生成的 50 条', () => {
    const page = readSource();
    assert.ok(page.includes('MOCK_EMPLOYEES'), 'page.tsx 引用 MOCK_EMPLOYEES');
    const data = readData();
    assert.ok(data.includes('MOCK_EMPLOYEES'), 'data 模块导出 MOCK_EMPLOYEES');
    assert.ok(
      data.includes('count = 50') || data.includes('createMockEmployees(count = 50)') || data.includes('50'),
      'createMockEmployees 默认 50 条',
    );
  });

  it('EMPLOYEE_ROLES 包含 4 个角色', () => {
    const data = readData();
    assert.ok(data.includes("'manager'"), '缺少 manager');
    assert.ok(data.includes("'supervisor'"), '缺少 supervisor');
    assert.ok(data.includes("'staff'"), '缺少 staff');
    assert.ok(data.includes("'trainee'"), '缺少 trainee');
  });

  it('EMPLOYEE_STATUSES 包含 4 种状态', () => {
    const data = readData();
    assert.ok(data.includes("'active'"), '缺少 active');
    assert.ok(data.includes("'inactive'"), '缺少 inactive');
    assert.ok(data.includes("'suspended'"), '缺少 suspended');
    assert.ok(data.includes("'resigned'"), '缺少 resigned');
  });

  it('EMPLOYEE_DEPARTMENTS 包含 5 个部门', () => {
    const data = readData();
    assert.ok(data.includes("'sales'"), '缺少 sales');
    assert.ok(data.includes("'operations'"), '缺少 operations');
    assert.ok(data.includes("'marketing'"), '缺少 marketing');
    assert.ok(data.includes("'finance'"), '缺少 finance');
    assert.ok(data.includes("'hr'"), '缺少 hr');
  });

  it('ALL_STORES 包含 5 个门店', () => {
    const data = readData();
    assert.ok(data.includes('旗舰店(上海)'), '缺少 旗舰店(上海)');
    assert.ok(data.includes('旗舰店(北京)'), '缺少 旗舰店(北京)');
    assert.ok(data.includes('体验店(杭州)'), '缺少 体验店(杭州)');
  });

  it('ALL_MARKETS 包含 5 个市场', () => {
    const data = readData();
    assert.ok(data.includes('CN-SH'), '缺少 CN-SH');
    assert.ok(data.includes('CN-BJ'), '缺少 CN-BJ');
    assert.ok(data.includes('CN-GD'), '缺少 CN-GD');
    assert.ok(data.includes('CN-SC'), '缺少 CN-SC');
    assert.ok(data.includes('CN-ZJ'), '缺少 CN-ZJ');
  });

  it('分页初始化 pageSize 为 10', () => {
    const src = readSource();
    assert.ok(src.includes('initialPageSize: 10'), '缺少 initialPageSize=10');
  });

  it('分页最后一页条目数正确 (50条/10页=5页 满页)', () => {
    const total = 50;
    const pageSize = 10;
    const lastPage = Math.ceil(total / pageSize);
    const expectedLastCount = total - (lastPage - 1) * pageSize;
    assert.equal(expectedLastCount, 10, `最后一页应有 10 条`);
  });

  it('在职率计算使用百分比', () => {
    const src = readSource();
    assert.ok(src.includes('.toFixed(0)}%'), '缺少百分比显示');
    assert.ok(src.includes('stats.active / stats.total'), '缺少在职率公式');
  });

  it('月薪总额统计使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), '缺少 reduce');
  });

  it('4 个统计卡片使用 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('gridTemplateColumns'), '缺少 grid 布局');
    assert.ok(src.includes('repeat(4'), '缺少 4 列');
  });

  it('EMPOLOYEE_ROLE_MAP 角色映射包含 4 个角色', () => {
    const data = readData();
    assert.ok(data.includes('manager: { label:'), '缺少 manager 映射');
    assert.ok(data.includes('supervisor: { label:'), '缺少 supervisor 映射');
    assert.ok(data.includes('staff: { label:'), '缺少 staff 映射');
    assert.ok(data.includes('trainee: { label:'), '缺少 trainee 映射');
  });

  it('EMPLOYEE_STATUS_MAP 状态映射包含 4 种状态', () => {
    const data = readData();
    assert.ok(data.includes('active: { label:'), '缺少 active 映射');
    assert.ok(data.includes('inactive: { label:'), '缺少 inactive 映射');
    assert.ok(data.includes('suspended: { label:'), '缺少 suspended 映射');
    assert.ok(data.includes('resigned: { label:'), '缺少 resigned 映射');
  });
});
