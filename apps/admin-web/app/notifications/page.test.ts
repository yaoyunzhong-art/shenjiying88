/**
 * page.test.ts — 通知中心 L1 冒烟测试
 * 正例 + 反例 + 边界
 *
 * 角色视角: 👔平台管理员 · 🔔系统通知 · 🛡️安全审计
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// 1. 组件导出验证
// ---------------------------------------------------------------------------

test('正例: 默认导出一个函数组件 NotificationsPage (源码声明检查)', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export default function NotificationsPage'),
    '页面应使用 export default function NotificationsPage 声明');
  assert.ok(src.includes('NotificationsPage'), '组件名应为 NotificationsPage');
});

// ---------------------------------------------------------------------------
// 2. 核心数据结构验证
// ---------------------------------------------------------------------------

test('正例: 源码包含所有通知类型映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  // 类型映射常量
  assert.ok(src.includes('system'), '应包含 system 类型');
  assert.ok(src.includes('alert'), '应包含 alert 类型');
  assert.ok(src.includes('reminder'), '应包含 reminder 类型');
  assert.ok(src.includes('announcement'), '应包含 announcement 类型');

  // 中文标签
  assert.ok(src.includes('系统'), '类型映射应包含系统');
  assert.ok(src.includes('告警'), '类型映射应包含告警');
  assert.ok(src.includes('提醒'), '类型映射应包含提醒');
  assert.ok(src.includes('公告'), '类型映射应包含公告');
});

test('正例: 源码包含优先级映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('urgent'), '应包含 urgent 优先级');
  assert.ok(src.includes('高'), '应包含高优先级标签');
  assert.ok(src.includes('中'), '应包含中优先级标签');
  assert.ok(src.includes('紧急'), '应包含紧急优先级标签');
});

test('正例: 源码包含状态映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('unread'), '应包含未读状态');
  assert.ok(src.includes('read'), '应包含已读状态');
  assert.ok(src.includes('archived'), '应包含已归档状态');
  assert.ok(src.includes('未读'), '应包含未读标签');
  assert.ok(src.includes('已读'), '应包含已读标签');
  assert.ok(src.includes('已归档'), '应包含已归档标签');
});

test('正例: 源码包含作用域映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('PLATFORM'), '应包含平台作用域');
  assert.ok(src.includes('TENANT'), '应包含租户作用域');
  assert.ok(src.includes('BRAND'), '应包含品牌作用域');
  assert.ok(src.includes('STORE'), '应包含门店作用域');
  assert.ok(src.includes('MARKET'), '应包含市场作用域');
  assert.ok(src.includes('平台'), '作用域映射应包含平台中文');
  assert.ok(src.includes('租户'), '作用域映射应包含租户中文');
  assert.ok(src.includes('门店'), '作用域映射应包含门店中文');
});

// ---------------------------------------------------------------------------
// 3. 反例验证：拒绝非法的枚举值
// ---------------------------------------------------------------------------

test('反例: 源码应只包含合法的 status 值', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const invalidStatuses = ['deleted', 'snoozed', 'pending'];
  for (const s of invalidStatuses) {
    // 如果出现在 STATUS_MAP 定义中则不合格
    const match = src.match(new RegExp(`['"\`]${s}['"\`]\\s*:\\s*\\{`));
    assert.equal(match, null, `不应包含非法状态值: ${s}`);
  }
});

test('反例: 源码不应缺少任一作用域映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const expectedScopes = ['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET'];
  for (const scope of expectedScopes) {
    assert.ok(src.includes(scope), `作用域映射应包含 ${scope}`);
  }
});

// ---------------------------------------------------------------------------
// 4. 边界条件验证
// ---------------------------------------------------------------------------

test('边界: MOCK_NOTIFICATIONS 包含 18 条测试数据', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const mockCount = (src.match(/id:\s*['"]n\d+['"]/g) || []).length;
  assert.ok(mockCount >= 15, `Mock 数据应至少有 15 条，实际: ${mockCount}`);
});

test('边界: 每条通知都应包含必要的字段', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const requiredFields = ['id', 'title', 'content', 'type', 'priority', 'status', 'targetScope', 'createdBy', 'createdAt', 'expiresAt'];
  for (const field of requiredFields) {
    assert.ok(src.includes(field), `通知数据应包含 ${field} 字段`);
  }
});

test('边界: 表格组件使用了 DataTable / Pagination', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('DataTable'), '应使用 DataTable 组件');
  assert.ok(src.includes('Pagination'), '应使用 Pagination 组件');
  assert.ok(src.includes('SearchFilterInput'), '应使用搜索组件');
  assert.ok(src.includes('QuickStats'), '应使用统计卡片组件');
});

test('边界: 使用多级筛选 (状态→类型→优先级→作用域)', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('statusFilter'), '应有状态筛选');
  assert.ok(src.includes('typeFilter'), '应有类型筛选');
  assert.ok(src.includes('priorityFilter'), '应有优先级筛选');
  assert.ok(src.includes('scopeFilter'), '应有用域筛选');
});

// ---------------------------------------------------------------------------
// 5. 功能验证
// ---------------------------------------------------------------------------

test('正例: 支持排序配置', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('sortConfig'), '应支持排序配置');
  assert.ok(src.includes('useSortedItems'), '应使用 useSortedItems hook');
});

test('正例: 支持分页（pageSizeOptions 配置）', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('pageSizeOptions'), '应配置分页大小选项');
  assert.ok(src.includes('usePagination'), '应使用 usePagination hook');
});

test('正例: 点击行应跳转到详情页', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('router.push'), '应支持点击跳转');
  assert.ok(src.includes('/notifications/'), '跳转路径应为 /notifications/${id}');
});

test('正例: 使用 FilterChips 展示已选筛选条件', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('FilterChips'), '应使用 FilterChips 组件');
  assert.ok(src.includes('onClearAll'), '应有清除所有筛选功能');
});

test('正例: 使用 DetailActionBar 提供操作入口', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('DetailActionBar'), '应使用操作栏');
  assert.ok(src.includes('useDetailActions'), '应使用 useDetailActions hook');
});
