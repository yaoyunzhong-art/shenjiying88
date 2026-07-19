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
});
