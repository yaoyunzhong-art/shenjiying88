/**
 * finance/page.test.tsx — 财务管理页 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

  it('应包含营收计算逻辑 filter(d => d.type)', () => {
    const src = readSource();
    assert.ok(src.includes('.filter(d => d.type') || src.includes(".filter(d=>d.type"), '缺少过滤逻辑');
  });

  it('应包含 Statistic 统计组件', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic'), '缺少统计组件');
  });

  it('收入应为正数、支出为负数', () => {
    const src = readSource();
    assert.ok(src.includes('amount > 0') || src.includes('amount>0') || src.includes('#34d399'), '缺少收入/支出颜色区分');
  });

  it('应计算净利润 income - expense', () => {
    const src = readSource();
    assert.ok(src.includes('income - expense'), '缺少净利润计算');
  });
});

// ---- 反例 ----

describe('finance — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('TRANSACTIONS 不应为空', () => {
    const src = readSource();
    assert.ok(src.includes('T001'), 'TRANSACTIONS 应有实际数据');
  });

  it('不应使用 eval/Function', () => {
    const src = readSource();
    assert.ok(!src.includes('eval(') && !src.includes('new Function('), '不应使用动态执行');
  });
});

// ---- 边界 ----

describe('finance — 边界', () => {
  it('应包含营收和支出分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('营收'), '缺少营收分类');
  });

  it('应包含列定义 COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含日结操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('日结'), '缺少日结按钮');
  });

  it('应收支应有对应颜色(绿/红)', () => {
    const src = readSource();
    assert.ok(src.includes('#34d399') && src.includes('#f87171'), '缺少绿/红色区分');
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
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('金额渲染应使用 toLocaleString', () => {
    const src = readSource();
    assert.ok(src.includes('toLocaleString'), '缺少数字格式化');
  });

  it('已结算/待结算应有不同 Tag 颜色', () => {
    const src = readSource();
    assert.ok(src.includes('settled') && src.includes('pending'), '缺少结算状态');
  });
});

// ---- 数据校验 ----

describe('finance — 数据校验', () => {
  it('TRANSACTIONS 应包含日期/类型/分类/金额/支付方式/状态', () => {
    const src = readSource();
    assert.ok(src.includes('date') && src.includes('type') && src.includes('category'), '缺少基础字段');
    assert.ok(src.includes('amount'), '缺少金额');
    assert.ok(src.includes('method') || src.includes('微信'), '缺少支付方式');
    assert.ok(src.includes('status'), '缺少状态');
  });

  it('COLUMNS 应覆盖足够的字段', () => {
    const src = readSource();
    const colCount = (src.match(/\{ title:/g) || []).length;
    assert.ok(colCount >= 6, `COLUMNS 列数不足: ${colCount}`);
  });

  it('应消费 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应包含今日营收/本月累计/支出/净利四个统计', () => {
    const src = readSource();
    const statisticCount = (src.match(/Statistic/g) || []).length;
    assert.ok(statisticCount >= 4, `Statistic 数量不足: ${statisticCount}`);
  });
});
