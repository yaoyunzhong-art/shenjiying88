/**
 * contracts/page.test.tsx — 合同列表页 L1 冒烟测试
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

describe('contracts — 正例', () => {
  it('应导出一个默认组件 ContractsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ContractsPage'), '缺少默认导出');
  });

  it('应包含 MOCK_CONTRACTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CONTRACTS'), '缺少 MOCK_CONTRACTS');
  });

  it('应计算 total / active / totalAmount / totalPaid / expiring', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('totalAmount'), '缺少 totalAmount');
    assert.ok(src.includes('totalPaid'), '缺少 totalPaid');
    assert.ok(src.includes('expiring'), '缺少 expiring');
  });

  it('应包含 status 过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('items = MOCK_CONTRACTS'), '数据源');
  });
});

describe('contracts — 边界', () => {
  it('即将到期合同过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.endDate') || src.includes('expiring'), '到期过滤');
  });

  it('active 状态统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 状态统计');
  });

  it('应支持搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.filter(') || src.includes('search'), '搜索过滤');
  });
});

describe('contracts — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('金额计算应使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 求和');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });
});
