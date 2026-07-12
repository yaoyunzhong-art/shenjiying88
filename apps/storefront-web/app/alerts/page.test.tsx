/**
 * alerts/page.test.tsx — 消息通知页 L1 冒烟测试 (storefront-web)
 * 适配实际页面 AlertsPage
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

describe('alerts — 正例', () => {
  it('应导出一个默认组件 AlertsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AlertsPage'), '缺少默认导出');
  });

  it('应包含页面标题"消息通知"', () => {
    const src = readSource();
    assert.ok(src.includes('消息通知'), '缺少页面标题');
  });

  it('应包含 alerts 数据定义', () => {
    const src = readSource();
    assert.ok(src.includes('alerts'), '缺少 alerts 定义');
  });

  it('应包含 6 条通知（增强后）', () => {
    const src = readSource();
    const match = src.match(/id: '/g);
    assert.ok(match && match.length === 6, '应有 6 条通知');
  });

  it('应包含不同通知类型', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'success'"), '缺少 success 类型');
    assert.ok(src.includes("type: 'info'"), '缺少 info 类型');
    assert.ok(src.includes("type: 'points'"), '缺少 points 类型');
    assert.ok(src.includes("type: 'upgrade'"), '缺少 upgrade 类型');
    assert.ok(src.includes("type: 'warning'"), '缺少 warning 类型');
    assert.ok(src.includes("type: 'system'"), '缺少 system 类型');
  });

  it('应包含 loading/error/empty 三态', () => {
    const src = readSource();
    assert.ok(src.includes('loading'), '缺少 loading 状态');
    assert.ok(src.includes('error'), '缺少 error 状态');
    assert.ok(src.includes('simulateFetch'), '缺少模拟 API');
    assert.ok(src.includes('filter'), '缺少筛选逻辑');
    assert.ok(src.includes('markRead'), '缺少标记已读');
  });

  it('应包含骨架屏占位', () => {
    const src = readSource();
    assert.ok(src.includes('Loading skeleton'), '缺少骨架屏注释');
    assert.ok(src.includes('height: 16'), '缺少骨架屏动画');
  });
});

describe('alerts — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
});
