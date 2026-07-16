import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('FinancePage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function FinancePage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('FinancePage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('FinancePage — 财务模块', () => {
  it('应包含交易数据定义', () => assert.ok(SRC.includes('interface') || SRC.includes('TRANSACTIONS')));
  it('应包含 TRANSACTIONS 数据', () => assert.ok(SRC.includes('TRANSACTIONS')));
  it('应使用 useMemo 筛选', () => assert.ok(SRC.includes('useMemo')));
  it('应支持 Tab 切换', () => assert.ok(SRC.includes('overview') && SRC.includes('detail')));
  it('应包含 Table 明细展示', () => assert.ok(SRC.includes('Table')));
});

describe('FinancePage — 统计财务指标', () => {
  it('应计算营收', () => assert.ok(SRC.includes('income') && SRC.includes('expense')));
  it('应计算净利润', () => assert.ok(SRC.includes('netProfit')));
  it('应计算毛利率', () => assert.ok(SRC.includes('毛利率') || SRC.includes('margin')));
  it('应展示收入/支出结构', () => assert.ok(SRC.includes('Progress')));
});

describe('FinancePage — 交互', () => {
  it('应包含日结 Modal', () => assert.ok(SRC.includes('showSettle') && SRC.includes('Modal')));
  it('应支持类型筛选', () => assert.ok(SRC.includes('typeFilter')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});
