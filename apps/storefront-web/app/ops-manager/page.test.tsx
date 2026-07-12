/**
 * ops-manager/page.test.tsx — 运营经理工作台 L1 冒烟测试 (storefront-web)
 * 适配实际页面 OpsManagerPage
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

describe('ops-manager/page — 正例', () => {
  it('应导出一个默认组件 OpsManagerPage', () => {
    const src = readSource();
    assert.match(src, /export default function OpsManagerPage/);
  });

  it('应包含运营任务标题', () => {
    const src = readSource();
    assert.match(src, /运营任务/);
  });

  it('应包含至少 4 个任务', () => {
    const src = readSource();
    const matches = src.match(/title: '/g);
    assert.ok(matches && matches.length >= 4, `期望 ≥4 个任务, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含早间巡检任务', () => {
    const src = readSource();
    assert.ok(src.includes('早间巡检'));
  });

  it('应包含设备检查任务', () => {
    const src = readSource();
    assert.ok(src.includes('设备检查'));
  });

  it('应包含库存确认任务', () => {
    const src = readSource();
    assert.ok(src.includes('库存确认'));
  });

  it('应包含日终结算任务', () => {
    const src = readSource();
    assert.ok(src.includes('日终结算'));
  });

  it('应包含已完成和未完成任务标识', () => {
    const src = readSource();
    assert.ok(src.includes('done: true') && src.includes('done: false'));
  });

  it('应包含深色主题背景', () => {
    const src = readSource();
    assert.ok(src.includes('#0f172a'), '缺少深色背景');
  });
});

describe('ops-manager/page — 防御性编程', () => {
  it('不应包含硬编码的 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|token|api[_-]?key|authorization)/i);
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
});
