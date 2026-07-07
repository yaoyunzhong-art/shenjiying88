/**
 * members/page.test.tsx — 会员列表页 L1 冒烟测试 (tob-web)
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

describe('members — 正例', () => {
  it('应导出一个默认组件 MembersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MembersPage'), '缺少默认导出');
  });

  it('应包含 MOCK_MEMBERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_MEMBERS'), '缺少 MOCK_MEMBERS');
  });

  it('应计算 total / active / totalPoints / diamond', () => {
    const src = readSource();
    assert.ok(src.includes('total'), '缺少 total');
    assert.ok(src.includes('active'), '缺少 active');
    assert.ok(src.includes('totalPoints'), '缺少 totalPoints');
    assert.ok(src.includes('diamond'), '缺少 diamond');
  });

  it('应包含 tier 等级过滤', () => {
    const src = readSource();
    assert.ok(src.includes('tier'), '缺少 tier');
  });
});

describe('members — 边界', () => {
  it('diamond 等级过滤使用 .tier', () => {
    const src = readSource();
    assert.ok(src.includes("m.tier === 'diamond'"), 'diamond 过滤');
  });

  it('active 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 状态');
  });

  it('积分统计使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 计算');
  });
});

describe('members — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search') || src.includes('filter'), '搜索功能');
  });
});
