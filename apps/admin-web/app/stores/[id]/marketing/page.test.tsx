/**
 * marketing/page.test.tsx — 营销管理页面 L1 冒烟测试
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

describe('marketing — 正例', () => {
  it('应导出一个默认组件 MarketingPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MarketingPage'), '缺少默认导出组件');
  });

  it('应包含营销活动数据 CAMPAIGNS', () => {
    const src = readSource();
    assert.ok(src.includes('CAMPAIGNS'), '缺少活动数据');
  });

  it('应包含活动状态字段', () => {
    const src = readSource();
    assert.ok(src.includes('active') || src.includes('draft'), '缺少活动状态');
  });

  it('应包含 DataTable 表格组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });
});

// ---- 边界 ----

describe('marketing — 边界', () => {
  it('应包含 Columns 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含创建活动按钮', () => {
    const src = readSource();
    assert.ok(src.includes('创建活动'), '缺少创建活动按钮');
  });

  it('应包含预算统计', () => {
    const src = readSource();
    assert.ok(src.includes('budget'), '缺少预算统计');
  });
});

// ---- 防御 ----

describe('marketing — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
});
