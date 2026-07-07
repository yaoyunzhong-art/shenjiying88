/**
 * notifications/page.test.tsx — 通知列表页 L1 冒烟测试 (tob-web)
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

describe('notifications — 正例', () => {
  it('应导出一个默认组件 TobNotificationsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TobNotificationsPage'), '缺少默认导出');
  });

  it('应包含 NotificationItem 接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface NotificationItem'), '缺少接口');
  });

  it('应包含 MOCK_NOTIFICATIONS', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_NOTIFICATIONS'), '缺少数据源');
  });

  it('应计算 total / unread / alert / urgent', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('unread:'), '缺少 unread');
    assert.ok(src.includes('alert:'), '缺少 alert');
    assert.ok(src.includes('urgent:'), '缺少 urgent');
  });
});

describe('notifications — 边界', () => {
  it('unread 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes("n.status === 'unread'"), 'unread 过滤');
  });

  it('alert 类型过滤', () => {
    const src = readSource();
    assert.ok(src.includes("n.type === 'alert'"), 'alert 过滤');
  });

  it('urgent 优先级过滤', () => {
    const src = readSource();
    assert.ok(src.includes("n.priority === 'urgent'"), 'urgent 过滤');
  });
});

describe('notifications — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('通知类型 / 优先级 / 状态字段齐全', () => {
    const src = readSource();
    assert.ok(src.includes('type:'), '缺少 type');
    assert.ok(src.includes('priority:'), '缺少 priority');
  });
});
