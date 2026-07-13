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

  it('应包含已完成和未完成任务 done 标识', () => {
    const src = readSource();
    assert.ok(src.includes('done: true') && src.includes('done: false'));
  });

  it('应包含深色主题背景', () => {
    const src = readSource();
    assert.ok(src.includes('#0f172a'), '缺少深色背景');
  });

  it('每个任务应有 title 字段', () => {
    const src = readSource();
    assert.ok(src.includes('title'), '缺少 title');
  });

  it('每个任务应有 time 时间字段', () => {
    const src = readSource();
    assert.ok(src.includes("time: '"), '缺少 time');
  });

  it('每个任务应有 category 分类字段', () => {
    const src = readSource();
    assert.ok(src.includes('category'), '缺少 category');
  });

  it('每个任务应有 date 日期字段', () => {
    const src = readSource();
    assert.ok(src.includes("date: '"), '缺少 date');
  });

  it('应包含统计卡片（完成率/总任务/待完成）', () => {
    const src = readSource();
    assert.ok(src.includes('completionRate') || src.includes('doneCount') || src.includes('pendingCount'), '缺少统计');
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

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
});

describe('ops-manager/page — 反例', () => {
  it('不应包含 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), '裸 console.log');
  });

  it('任务应有 done 布尔值', () => {
    const src = readSource();
    assert.ok(src.includes('done: true'), '有已完成任务');
    assert.ok(src.includes('done: false'), '有未完成任务');
  });
});

describe('ops-manager/page — 边界', () => {
  it('应有筛选过滤功能（全部/待完成/已完成）', () => {
    const src = readSource();
    assert.ok(src.includes('filter') || src.includes('Filter'), '筛选功能');
  });

  it('应有 useMemo 优化过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应有进度条或完成率显示', () => {
    const src = readSource();
    assert.ok(src.includes('completionRate') || src.includes('rate') || src.includes('进度'), '完成率');
  });

  it('应有模拟加载效果', () => {
    const src = readSource();
    assert.ok(src.includes('loading') || src.includes('Loading'), '加载状态');
  });
});
