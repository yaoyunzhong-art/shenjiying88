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

  it('应包含 4 条通知', () => {
    const src = readSource();
    const match = src.match(/id: '/g);
    assert.ok(match && match.length === 4, '应有 4 条通知');
  });

  it('应包含不同通知类型', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'success'"), '缺少 success 类型');
    assert.ok(src.includes("type: 'info'"), '缺少 info 类型');
    assert.ok(src.includes("type: 'points'"), '缺少 points 类型');
    assert.ok(src.includes("type: 'upgrade'"), '缺少 upgrade 类型');
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
