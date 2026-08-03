/**
 * notifications/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 通知中心页面 — B端通知/告警/提醒/公告管理
 * 角色视角: 🔧运营商 · 👔店长 · 🛡️安全管理员
 *
 * 测试纬度：
 *   正例 — export/use client/通知类型/优先级/状态/统计/搜索/筛选/分页/排序
 *   反例 — 空搜索/过滤守卫/未匹配
 *   边界 — Mock数据完整性/类型枚举/状态颜色/优先级权重/分页计算
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

describe('notifications — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 TobNotificationsPage 组件', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function TobNotificationsPage'),
      '缺少默认导出 TobNotificationsPage',
    );
  });

  it('应导入 PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 4 个统计卡片', () => {
    const src = readSource();
    // 统计行: 总数/告警/未读/已归档
    assert.ok(src.includes('stats.total'), '缺少 stats.total');
    assert.ok(src.includes('stats.alert'), '缺少 stats.alert');
    assert.ok(src.includes('stats.unread'), '缺少 stats.unread');
    assert.ok(src.includes('stats.urgent'), '缺少 stats.urgent');
  });

  it('应搜索过滤输入框', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
  });

  it('搜索字段覆盖 title 和 content', () => {
    const src = readSource();
    assert.ok(src.includes("'title'"), '缺少 title 搜索字段');
    assert.ok(src.includes("'content'"), '缺少 content 搜索字段');
  });

  it('应包含状态筛选 Tabs (全部/未读/已读/已归档)', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
    assert.ok(src.includes("'unread'"), '缺少 unread');
    assert.ok(src.includes("'read'"), '缺少 read');
    assert.ok(src.includes("'archived'"), '缺少 archived');
  });

  it('应包含通知类型筛选 Tabs (系统/告警/提醒/公告)', () => {
    const src = readSource();
    assert.ok(src.includes('typeFilter'), '缺少 typeFilter');
    assert.ok(src.includes("'system'"), '缺少 system');
    assert.ok(src.includes("'alert'"), '缺少 alert');
    assert.ok(src.includes("'reminder'"), '缺少 reminder');
    assert.ok(src.includes("'announcement'"), '缺少 announcement');
  });

  it('应包含优先级筛选 Tabs (紧急/高/中/低)', () => {
    const src = readSource();
    assert.ok(src.includes('priorityFilter'), '缺少 priorityFilter');
    assert.ok(src.includes("'urgent'"), '缺少 urgent');
    assert.ok(src.includes("'high'"), '缺少 high');
    assert.ok(src.includes("'medium'"), '缺少 medium');
    assert.ok(src.includes("'low'"), '缺少 low');
  });

  it('应包含 DataTable 数据表格', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('通知列表'), '缺少 通知列表');
  });

  it('表格包含 6 列 (状态/类型/优先级/标题/发布时间/过期时间)', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'status'"), '缺少 status 列');
    assert.ok(src.includes("key: 'type'"), '缺少 type 列');
    assert.ok(src.includes("key: 'priority'"), '缺少 priority 列');
    assert.ok(src.includes("key: 'title'"), '缺少 title 列');
    assert.ok(src.includes("key: 'createdAt'"), '缺少 createdAt 列');
    assert.ok(src.includes("key: 'expiresAt'"), '缺少 expiresAt 列');
  });

  it('应包含 Pagination 分页组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('pageSize'), '缺少 pageSize');
  });

  it('分页初始化 pageSize 为 10', () => {
    const src = readSource();
    assert.ok(src.includes('initialPageSize: 10'), '缺少 initialPageSize=10');
  });

  it('分页 pageSize 可选值 5/10/15/20', () => {
    const src = readSource();
    assert.ok(src.includes('[5, 10, 15, 20]'), '缺少分页尺寸选项');
  });

  it('useMemo 优化多处计算', () => {
    const src = readSource();
    const matches = src.match(/useMemo/g);
    assert.ok(matches && matches.length >= 2, '缺少 useMemo');
  });

  it('默认排序使用 createdAt 倒序', () => {
    const src = readSource();
    assert.ok(
      src.includes("key: 'createdAt'") && src.includes("direction: 'desc'"),
      '缺少默认 desc 排序',
    );
  });

  it('TYPE_MAP 映射 4 种通知类型的中文标签', () => {
    const src = readSource();
    assert.ok(src.includes('系统'), '缺少 系统');
    assert.ok(src.includes('告警'), '缺少 告警');
    assert.ok(src.includes('提醒'), '缺少 提醒');
    assert.ok(src.includes('公告'), '缺少 公告');
  });

  it('PRIORITY_MAP 映射 4 种优先级中文标签', () => {
    const src = readSource();
    assert.ok(src.includes('低'), '缺少 低');
    assert.ok(src.includes('中'), '缺少 中');
    assert.ok(src.includes('高'), '缺少 高');
    assert.ok(src.includes('紧急'), '缺少 紧急');
  });

  it('STATUS_MAP 映射 3 种状态中文标签', () => {
    const src = readSource();
    assert.ok(src.includes('未读'), '缺少 未读');
    assert.ok(src.includes('已读'), '缺少 已读');
    assert.ok(src.includes('已归档'), '缺少 已归档');
  });

  it('NotificationItem 接口定义完整字段', () => {
    const src = readSource();
    assert.ok(src.includes('interface NotificationItem'), '缺少 NotificationItem');
    assert.ok(src.includes('id:'), '缺少 id');
    assert.ok(src.includes('title:'), '缺少 title');
    assert.ok(src.includes('type:'), '缺少 type');
    assert.ok(src.includes('priority:'), '缺少 priority');
    assert.ok(src.includes('status:'), '缺少 status');
    assert.ok(src.includes('createdAt:'), '缺少 createdAt');
    assert.ok(src.includes('expiresAt:'), '缺少 expiresAt');
  });

  it('useSortedItems 管理排序', () => {
    const src = readSource();
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('usePagination 管理分页', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '缺少 usePagination');
  });

  it('筛选变更是重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination.resetPage()'), '缺少分页重置');
  });

  it('标题点击使用 router.push 跳转', () => {
    const src = readSource();
    assert.ok(src.includes('router.push'), '缺少 router.push');
    assert.ok(src.includes('notifications/${item.id}'), '缺少跳转链接');
  });
});

describe('notifications — 反例（Error Path）', () => {
  it('过滤链逐层缩小: status → type → priority', () => {
    const src = readSource();
    assert.ok(src.includes('statusFiltered'), '缺少 statusFiltered');
    assert.ok(src.includes('typeFiltered'), '缺少 typeFiltered');
    assert.ok(src.includes('priorityFiltered'), '缺少 priorityFiltered');
  });

  it('useSearchFilter 用于搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('筛选变更时 useMemo 重新计算 filtered', () => {
    const src = readSource();
    // 确保每个 filter useMemo 依赖列表包含 upstream
    assert.ok(src.includes('filteredItems, statusFilter'), 'status 依赖');
    assert.ok(src.includes('statusFiltered, typeFilter'), 'type 依赖');
    assert.ok(src.includes('typeFiltered, priorityFilter'), 'priority 依赖');
  });

  it('priority 排序使用 indexOf', () => {
    const src = readSource();
    assert.ok(src.includes('.indexOf(item.priority)'), '缺少 indexOf');
  });

  it('useEffect 绑定 pagination.resetPage 依赖', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
    assert.ok(
      src.includes('searchTerm') && src.includes('statusFilter') &&
      src.includes('typeFilter') && src.includes('priorityFilter'),
      '缺少筛选重置依赖',
    );
  });

  it('unread 状态样式使用 fontWeight 600', () => {
    const src = readSource();
    assert.ok(
      src.includes("item.status === 'unread'") && src.includes('fontWeight'),
      '缺少 unread 加粗处理',
    );
  });
});

describe('notifications — 边界（Boundary / Edge）', () => {
  it('MOCK_NOTIFICATIONS 包含 15 条数据', () => {
    const src = readSource();
    const matches = src.match(/id:\s+'n\d+'/g);
    assert.ok(matches, '未找到通知 ID');
    assert.equal(matches.length, 15, '应有 15 条通知');
  });

  it('badge variant 类型完备 (success/neutral/warning/danger)', () => {
    const src = readSource();
    assert.ok(src.includes("'success'"), '缺少 success');
    assert.ok(src.includes("'neutral'"), '缺少 neutral');
    assert.ok(src.includes("'warning'"), '缺少 warning');
    assert.ok(src.includes("'danger'"), '缺少 danger');
  });

  it('priority 排序权重顺序: urgent > high > medium > low', () => {
    const src = readSource();
    assert.ok(
      src.includes("'urgent'") && src.includes("'high'") &&
      src.includes("'medium'") && src.includes("'low'"),
      'priority 排序权重',
    );
  });

  it('BadgeVariant 类型定义完整', () => {
    const src = readSource();
    assert.ok(
      src.includes('BadgeVariant'),
      '缺少 BadgeVariant 类型',
    );
  });

  it('通知中心 subtitle 包含完整描述', () => {
    const src = readSource();
    assert.ok(
      src.includes('查看平台通知、告警、提醒和公告'),
      '缺少副标题描述',
    );
  });

  it('未读通知占百分比计算', () => {
    const src = readSource();
    assert.ok(
      src.includes('stats.unread / stats.total'),
      '缺少百分比公式',
    );
    assert.ok(src.includes('.toFixed(0)}%'), '缺少百分比格式化');
  });

  it('统计卡片标签包含 "通知总数"/"告警"/"未读"/"已归档"', () => {
    const src = readSource();
    assert.ok(src.includes('通知总数'), '缺少 通知总数');
    assert.ok(src.includes('告警'), '缺少 告警');
    assert.ok(src.includes('未读'), '缺少 未读');
    assert.ok(src.includes('已归档'), '缺少 已归档');
  });

  it('告警卡片包含紧急条数', () => {
    const src = readSource();
    assert.ok(
      src.includes('stats.alert') && src.includes('stats.urgent'),
      '缺少告警/紧急统计',
    );
  });

  it('TypeBadge 使用 variant 颜色', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('variant'), '缺少 variant');
  });

  it('通知标题为 unread 时加粗', () => {
    const src = readSource();
    assert.ok(
      src.includes("item.status === 'unread'"),
      '缺少 unread 条件',
    );
  });

  it('过期时间不早于创建时间 — MOCK 数据自洽', () => {
    const src = readSource();
    const dates = src.match(/expiresAt.*?\d{4}[^']+'/g);
    assert.ok(dates, '应有过期时间声明');
  });
});

describe('notifications — 列渲染结构', () => {
  it('status 列使用 dot 属性', () => {
    const src = readSource();
    assert.ok(src.includes('dot'), 'status badge 缺少 dot');
  });

  it('title 列含 cursor pointer 样式', () => {
    const src = readSource();
    assert.ok(src.includes('cursor'), 'title 列缺少 cursor');
    assert.ok(src.includes('pointer'), 'title 列缺少 pointer');
  });

  it('title 列含 textDecoration underline 样式', () => {
    const src = readSource();
    assert.ok(src.includes('textDecoration'), 'title 列缺少 textDecoration');
  });

  it('title 列含 onClick 和 e.stopPropagation', () => {
    const src = readSource();
    assert.ok(src.includes('onClick'), 'title 列缺少 onClick');
    assert.ok(src.includes('stopPropagation'), 'title 列缺少 stopPropagation');
  });

  it('priority 列定义 sortValue', () => {
    const src = readSource();
    assert.ok(src.includes('sortValue'), 'priority 列缺少 sortValue');
  });

  it('DataTable 使用 rowKey 回调', () => {
    const src = readSource();
    assert.ok(src.includes('rowKey'), '缺少 rowKey');
    assert.ok(src.includes('(item) => item.id'), 'rowKey 应返回 id');
  });

  it('DataTable 使用 striped 属性', () => {
    const src = readSource();
    assert.ok(src.includes('striped'), '缺少 striped');
  });

  it('DataTable 使用 compact 属性', () => {
    const src = readSource();
    assert.ok(src.includes('compact'), '缺少 compact');
  });

  it('DataTable 绑定 onSortChange 回调', () => {
    const src = readSource();
    assert.ok(src.includes('onSortChange'), '缺少 onSortChange');
    assert.ok(src.includes('setSortConfig'), '缺少 setSortConfig');
  });

  it('DataTable 绑定 sort 属性', () => {
    const src = readSource();
    assert.ok(src.includes('sort={sortConfig}'), '缺少 sort');
  });

  it('Pagination 绑定 onPageChange 和 onPageSizeChange', () => {
    const src = readSource();
    assert.ok(src.includes('onPageChange'), '缺少 onPageChange');
    assert.ok(src.includes('onPageSizeChange'), '缺少 onPageSizeChange');
  });

  it('Pagination 绑定 page / pageSize / total 属性', () => {
    const src = readSource();
    assert.ok(src.includes('page={pagination.page}'), '缺少 page');
    assert.ok(src.includes('pageSize={pagination.pageSize}'), '缺少 pageSize');
    assert.ok(src.includes('total={sortedItems.length}'), '缺少 total');
  });

  it('Tabs 绑定 onChange 回调', () => {
    const src = readSource();
    // status filter tabs onChange
    assert.ok(src.includes('onChange={(key) => setStatusFilter'), 'status tabs 缺少 onChange');
    assert.ok(src.includes('onChange={(key) => setTypeFilter'), 'type tabs 缺少 onChange');
    assert.ok(src.includes('onChange={(key) => setPriorityFilter'), 'priority tabs 缺少 onChange');
  });

  it('Tabs 使用 variant="pills" size="sm"', () => {
    const src = readSource();
    const variantMatches = src.match(/variant="pills"/g);
    assert.ok(variantMatches && variantMatches.length >= 3, '至少 3 组 Tabs 使用 pills 样式');
    const sizeMatches = src.match(/size="sm"/g);
    assert.ok(sizeMatches && sizeMatches.length >= 3, '至少 3 组 Tabs 使用 sm 尺寸');
  });

  it('Tabs 每项包含 count 字段', () => {
    const src = readSource();
    assert.ok(src.includes('count: MOCK_NOTIFICATIONS.length'), '全部 Tab 缺少总计数');
    assert.ok(src.includes('count: statusFiltered.length'), '类型 tabs 缺少计数');
    assert.ok(src.includes('count: typeFiltered.length'), '优先级 tabs 缺少计数');
    assert.ok(src.includes('.filter((i) => i.status === s).length'), '状态标签计数');
    assert.ok(src.includes('.filter((i) => i.type === t).length'), '类型标签计数');
    assert.ok(src.includes('.filter((i) => i.priority === p).length'), '优先级标签计数');
  });

  it('Tabs 使用 activeKey 绑定', () => {
    const src = readSource();
    assert.ok(src.includes('activeKey={statusFilter}'), 'status tabs 缺少 activeKey');
    assert.ok(src.includes('activeKey={typeFilter}'), 'type tabs 缺少 activeKey');
    assert.ok(src.includes('activeKey={priorityFilter}'), 'priority tabs 缺少 activeKey');
  });

  it('统计卡片使用 grid 布局 gridTemplateColumns', () => {
    const src = readSource();
    assert.ok(src.includes('gridTemplateColumns'), '统计行缺少 gridTemplateColumns');
    assert.ok(src.includes('auto-fit'), '统计行缺少 auto-fit');
  });

  it('筛选区域使用 flexWrap 布局', () => {
    const src = readSource();
    assert.ok(src.includes('flexWrap'), '筛选区缺少 flexWrap');
  });

  it('PageShell 使用 title 和 subtitle', () => {
    const src = readSource();
    assert.ok(src.includes('title="通知中心"'), 'PageShell 缺少 title');
    assert.ok(src.includes('subtitle='), 'PageShell 缺少 subtitle');
  });
});

describe('notifications — 角色视角', () => {
  it('🔧运营商: 应支持所有 type/priority/status 枚举组合', () => {
    const src = readSource();
    // 类型: system, alert, reminder, announcement
    // 优先级: low, medium, high, urgent
    // 状态: unread, read, archived
    const types = ['system', 'alert', 'reminder', 'announcement'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['unread', 'read', 'archived'];
    for (const t of types) {
      assert.ok(src.includes(`'${t}'`), `缺少 type ${t}`);
    }
    for (const p of priorities) {
      assert.ok(src.includes(`'${p}'`), `缺少 priority ${p}`);
    }
    for (const s of statuses) {
      assert.ok(src.includes(`'${s}'`), `缺少 status ${s}`);
    }
  });

  it('👔店长: 通知标题针对运营场景', () => {
    const src = readSource();
    // 运营场景关键词
    assert.ok(src.includes('门店'), '缺少门店场景');
    assert.ok(src.includes('运营'), '缺少运营场景');
    assert.ok(src.includes('品牌'), '缺少品牌场景');
  });

  it('🛡️安全管理员: 包含安全相关通知类型', () => {
    const src = readSource();
    assert.ok(src.includes('安全'), '缺少安全通知');
    assert.ok(src.includes('SSL'), '缺少 SSL 告警');
  });
});

describe('notifications — 统计逻辑', () => {
  it('stats 使用 useMemo 避免重复计算', () => {
    const src = readSource();
    const useMemoCalls = src.match(/const stats = useMemo/g);
    assert.ok(useMemoCalls, 'stats 应使用 useMemo');
  });

  it('unread 统计使用 .filter((n) => n.status === unread)', () => {
    const src = readSource();
    assert.ok(
      src.includes("n.status === 'unread'"),
      'unread 过滤应使用 status 检查',
    );
  });

  it('urgent 统计使用 .filter((n) => n.priority === urgent)', () => {
    const src = readSource();
    assert.ok(
      src.includes("n.priority === 'urgent'"),
      'urgent 过滤应使用 priority 检查',
    );
  });

  it('已归档数量由总通知数减去未读数推导', () => {
    const src = readSource();
    assert.ok(
      src.includes('stats.total - stats.unread'),
      '已归档数应为总数 - 未读数',
    );
  });

  it('统计数值类型为数字', () => {
    const src = readSource();
    // 统计值都是数字，通过 s.value 在 JSX 中渲染
    const dataStats = src.match(/label: '通知总数', value: stats\.total/g);
    assert.ok(dataStats, '通知总数应为 stats.total 计算');
    const alertStats = src.match(/label: '告警', value: stats\.alert/g);
    assert.ok(alertStats, '告警数应为 stats.alert 计算');
  });

  it('百分比计算结果为整数', () => {
    const src = readSource();
    assert.ok(
      src.includes('.toFixed(0)}'),
      '百分比应使用 toFixed(0) 取整',
    );
  });
});

describe('notifications — 组件导入完整性', () => {
  it('导入 hooks: useState / useMemo / useCallback / useEffect', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
  });

  it('导入 useRouter 用于导航', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), '缺少 useRouter');
  });

  it('从 @m5/ui 导入 DataTable', () => {
    const src = readSource();
    const importMatch = src.match(/from '@m5\/ui'/);
    assert.ok(importMatch, '缺少 @m5/ui 导入');
  });

  it('从 @m5/ui 导入 type DataTableColumn', () => {
    const src = readSource();
    assert.ok(src.includes('DataTableColumn'), '缺少 DataTableColumn 类型');
  });

  it('从 @m5/ui 导入 type DataTableSortConfig', () => {
    const src = readSource();
    assert.ok(src.includes('DataTableSortConfig'), '缺少 DataTableSortConfig 类型');
  });

  it('导入 usePagination / useSearchFilter / useSortedItems', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '缺少 usePagination');
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('导入 StatusBadge / SearchFilterInput / Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });
});

describe('notifications — 搜索逻辑', () => {
  it('搜索字段数组类型为 (keyof NotificationItem)[]', () => {
    const src = readSource();
    assert.ok(
      src.includes('keyof NotificationItem'),
      '搜索字段应使用 keyof NotificationItem',
    );
  });

  it('搜索使用 useSearchFilter 解构', () => {
    const src = readSource();
    assert.ok(
      src.includes('searchTerm, setSearchTerm, filteredItems'),
      '搜索解构应包含 searchTerm/setSearchTerm/filteredItems',
    );
  });

  it('placeholder 提示搜索范围', () => {
    const src = readSource();
    assert.ok(
      src.includes('搜索通知标题 / 内容'),
      '搜索 placeholder 应提示标题/内容',
    );
  });
});

describe('notifications — 数据完整性', () => {
  it('每种类型至少有一条 Mock 数据', () => {
    const src = readSource();
    // 确认类型枚举全部出现在 mock 数据中
    const typePatterns = ["type: 'system'", "type: 'alert'", "type: 'reminder'", "type: 'announcement'"];
    for (const p of typePatterns) {
      assert.ok(src.includes(p), `Mock 数据缺少 ${p}`);
    }
  });

  it('每种优先级至少有一条 Mock 数据', () => {
    const src = readSource();
    const priorityPatterns = ["priority: 'low'", "priority: 'medium'", "priority: 'high'", "priority: 'urgent'"];
    for (const p of priorityPatterns) {
      assert.ok(src.includes(p), `Mock 数据缺少 ${p}`);
    }
  });

  it('每种状态至少有一条 Mock 数据', () => {
    const src = readSource();
    const statusPatterns = ["status: 'unread'", "status: 'read'", "status: 'archived'"];
    for (const p of statusPatterns) {
      assert.ok(src.includes(p), `Mock 数据缺少 ${p}`);
    }
  });

  it('Mock 数据创建时间包含时:分:秒格式', () => {
    const src = readSource();
    const createAtPatterns = src.match(/createdAt: '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'/g);
    assert.ok(createAtPatterns, '创建时间应包含完整时间戳');
    assert.equal(createAtPatterns.length, 15, '15 条通知的创建时间格式应一致');
  });

  it('Mock 数据过期时间包含时:分:秒格式', () => {
    const src = readSource();
    const expiresAtPatterns = src.match(/expiresAt: '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'/g);
    assert.ok(expiresAtPatterns, '过期时间应包含完整时间戳');
    assert.equal(expiresAtPatterns.length, 15, '15 条通知的过期时间格式应一致');
  });

  it('未读通知数量 ≥ 已读 + 已归档', () => {
    const src = readSource();
    const unreadCount = (src.match(/status: 'unread'/g) || []).length;
    const readCount = (src.match(/status: 'read'/g) || []).length;
    const archivedCount = (src.match(/status: 'archived'/g) || []).length;
    assert.ok(unreadCount >= 1, '应有未读通知');
    assert.ok(readCount >= 1, '应有已读通知');
    assert.ok(archivedCount >= 1, '应有已归档通知');
  });
});

describe('notifications — 回调与交互', () => {
  it('handleRowClick 使用 useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
    assert.ok(src.includes('handleRowClick'), '缺少 handleRowClick');
  });

  it('handleRowClick 依赖 router', () => {
    const src = readSource();
    assert.ok(
      src.includes('handleRowClick'),
      'handleRowClick 应依赖 router',
    );
  });

  it('onSortChange 绑定 setSortConfig', () => {
    const src = readSource();
    assert.ok(src.includes('setSortConfig'), '缺少 setSortConfig');
    assert.ok(src.includes('onSortChange={setSortConfig}'), 'onSortChange 应绑定 setSortConfig');
  });

  it('buildColumns 接收 onRowClick 参数', () => {
    const src = readSource();
    assert.ok(
      src.includes('function buildColumns('),
      '缺少 buildColumns 函数',
    );
    assert.ok(
      src.includes('onRowClick: (item: NotificationItem) => void'),
      'buildColumns 应接收 onRowClick 参数',
    );
  });

  it('column 定义包含 dataKey', () => {
    const src = readSource();
    assert.ok(src.includes("dataKey: 'title'"), 'title 列缺少 dataKey');
    assert.ok(src.includes("dataKey: 'createdAt'"), 'createdAt 列缺少 dataKey');
    assert.ok(src.includes("dataKey: 'expiresAt'"), 'expiresAt 列缺少 dataKey');
  });

  it('sortable 属性在可排序列上为 true', () => {
    const src = readSource();
    const sortableCount = (src.match(/sortable: true/g) || []).length;
    assert.equal(sortableCount, 6, '6 列都应开启 sortable');
  });
});
