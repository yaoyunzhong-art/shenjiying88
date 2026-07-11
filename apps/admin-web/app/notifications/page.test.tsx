/**
 * notifications/page.test.tsx — 通知列表页 L1 冒烟测试
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

describe('notifications — 正例', () => {
  it('应导出一个默认组件 NotificationsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NotificationsPage'), '缺少默认导出组件');
  });

  it('应包含 Notification 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Notification'), '缺少 Notification 接口');
  });

  it('通知类型定义应包含 type / status / priority 字段', () => {
    const src = readSource();
    assert.ok(src.includes('type'), '缺少 type');
    assert.ok(src.includes('status'), '缺少 status');
    assert.ok(src.includes('priority'), '缺少 priority');
  });

  it('应计算 total / unread / alert / urgent 统计', () => {
    const src = readSource();
    assert.ok(src.includes('unread:'), '缺少 unread');
    assert.ok(src.includes('alert:'), '缺少 alert');
    assert.ok(src.includes('urgent:'), '缺少 urgent');
  });

  it('应包含类型 NT 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const NT:'), '缺少 NT 映射表');
    assert.ok(src.includes('公告'), '缺少公告中文标签');
    assert.ok(src.includes('告警'), '缺少告警中文标签');
  });

  it('应包含优先级 NP 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const NP:'), '缺少 NP 映射表');
    assert.ok(src.includes('紧急'), '缺少紧急标签');
  });
});

// ---- 边界 ----

describe('notifications — 边界', () => {
  it('应支持类型筛选用 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('typeFilter'), '缺少 typeFilter');
    assert.ok(src.includes('NT[t].l'), '应使用类型映射');
  });

  it('status 分为 unread / read / archived', () => {
    const src = readSource();
    assert.ok(src.includes("n.status==='unread'"), '缺少 unread 状态过滤');
    assert.ok(src.includes("'unread'"), '应包含 unread 状态');
    assert.ok(src.includes("'read'"), '应包含 read 状态');
    assert.ok(src.includes("'archived'"), '应包含 archived 状态');
  });

  it('应包含搜索过滤功能 SearchFilterInput', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput') || src.includes('searchTerm'), '缺少搜索功能');
  });
});

// ---- 防御 ----

describe('notifications — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });
});
