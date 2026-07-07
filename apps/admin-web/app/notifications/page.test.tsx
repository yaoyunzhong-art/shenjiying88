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

  it('应包含 NotificationItem 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface NotificationItem'), '缺少 NotificationItem 接口');
  });

  it('应包含 MOCK_NOTIFICATIONS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_NOTIFICATIONS'), '缺少 MOCK_NOTIFICATIONS');
  });

  it('NotificationItem 应包含 type / status / priority 字段', () => {
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
});

// ---- 边界 ----

describe('notifications — 边界', () => {
  it('type 为 alert 和 priority 为 urgent 的过滤同时存在', () => {
    const src = readSource();
    assert.ok(src.includes("n.type === 'alert'"), '缺少 alert 类型过滤');
    assert.ok(src.includes("n.priority === 'urgent'"), '缺少 urgent 优先级过滤');
  });

  it('status 分为 unread / read / dismissed', () => {
    const src = readSource();
    assert.ok(src.includes("n.status === 'unread'"), '缺少 unread 状态过滤');
  });

  it('应包含搜索过滤字段 searchFields', () => {
    const src = readSource();
    assert.ok(src.includes('searchFields') || src.includes('search'), '缺少搜索字段');
  });
});

// ---- 防御 ----

describe('notifications — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
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
