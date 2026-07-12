/**
 * finance/page.test.tsx — 财务管理页 L1 冒烟测试
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

describe('finance — 正例', () => {
  it('应导出一个默认组件 FinancePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function FinancePage'), '缺少默认导出组件');
  });

  it('应包含交易数据 TRANSACTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('TRANSACTIONS'), '缺少交易数据');
  });

  it('应包含营收计算逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('.filter(d => d.type'), '缺少过滤逻辑');
  });

  it('应包含 Statistic 统计组件', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic'), '缺少统计组件');
  });
});

// ---- 边界 ----

describe('finance — 边界', () => {
  it('应包含营收和支出分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('营收'), '缺少营收分类');
  });

  it('应包含 Columns 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含结算操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('日结'), '缺少日结按钮');
  });
});

// ---- 防御 ----

describe('finance — 防御', () => {
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
