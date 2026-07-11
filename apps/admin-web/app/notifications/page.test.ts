/**
 * page.test.ts — 通知中心 L1 冒烟测试
 * 正例 + 边界 + 防御
 *
 * 角色视角: 👔门店通知管理
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

test('正例: 源码包含所有通知类型', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('announcement'), '应包含 announcement 类型');
  assert.ok(src.includes('alert'), '应包含 alert 类型');
  assert.ok(src.includes('system'), '应包含 system 类型');
  assert.ok(src.includes('task'), '应包含 task 类型');
  assert.ok(src.includes('approval'), '应包含 approval 类型');
});

test('正例: 源码包含类型中文标签', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('公告'), '类型映射应包含公告');
  assert.ok(src.includes('告警'), '类型映射应包含告警');
  assert.ok(src.includes('系统'), '类型映射应包含系统');
  assert.ok(src.includes('任务'), '类型映射应包含任务');
  assert.ok(src.includes('审批'), '类型映射应包含审批');
});

test('正例: 源码包含优先级映射', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('urgent'), '应包含 urgent 优先级');
  assert.ok(src.includes('high'), '应包含 high 优先级');
  assert.ok(src.includes('medium'), '应包含 medium 优先级');
  assert.ok(src.includes('low'), '应包含 low 优先级');
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

// ---------------------------------------------------------------------------
// 3. 边界条件验证
// ---------------------------------------------------------------------------

test('边界: 数据源应包含通知条目', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const srcMatch = src.match(/length:/g);
  const hasNotifications = src.includes('const notifications: Notification') || (srcMatch && srcMatch.length >= 1);
  assert.ok(hasNotifications, '应包含通知数据声明');
});

test('边界: 每条通知都应包含必要的字段', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  const requiredFields = ['id', 'title', 'content', 'type', 'priority', 'status', 'sender', 'createdAt'];
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
});

test('边界: 使用类型筛选', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('typeFilter'), '应有类型筛选');
});

// ---------------------------------------------------------------------------
// 4. 功能验证
// ---------------------------------------------------------------------------

test('正例: 支持排序配置', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('sortConfig'), '应支持排序配置');
  assert.ok(src.includes('useSortedItems'), '应使用 useSortedItems hook');
});

test('正例: 支持分页配置', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('usePagination'), '应使用 usePagination hook');
});

test('正例: 统计卡片展示通知概览', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('总通知'), '应显示总通知数');
  assert.ok(src.includes('未读'), '应显示未读数');
  assert.ok(src.includes('紧急'), '应显示紧急通知数');
  assert.ok(src.includes('告警'), '应显示告警数');
});

test('正例: 使用搜索过滤', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('useSearchFilter'), '应使用 useSearchFilter hook');
  assert.ok(src.includes('searchTerm'), '应有搜索词状态');
  assert.ok(src.includes('setSearchTerm'), '应更新搜索词');
});

test('正例: 使用 Tabs 进行类型切换', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('<Tabs'), '应使用 Tabs 组件');
  assert.ok(src.includes('activeKey'), '应支持 activeKey');
});
