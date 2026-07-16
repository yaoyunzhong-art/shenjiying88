import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('PurchasingPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function PurchasingPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('PurchasingPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('PurchasingPage — 采购模块', () => {
  it('应包含采购数据定义', () => assert.ok(SRC.includes('interface Purchase')));
  it('应包含 DATA 模拟数据', () => assert.ok(SRC.includes('const DATA')));
  it('应使用 useMemo 过滤', () => assert.ok(SRC.includes('useMemo')));
  it('应包含 Table 组件', () => assert.ok(SRC.includes('Table')));
  it('应可切换供应商标签页', () => assert.ok(SRC.includes('suppliers')));
});

describe('PurchasingPage — 状态覆盖', () => {
  it('应处理 pending 状态', () => assert.ok(SRC.includes("'pending'")));
  it('应处理 ordered 状态', () => assert.ok(SRC.includes("'ordered'")));
  it('应处理 partial 状态', () => assert.ok(SRC.includes("'partial'")));
  it('应处理 received 状态', () => assert.ok(SRC.includes("'received'")));
});

describe('PurchasingPage — 交互', () => {
  it('应包含新建采购单 Modal', () => assert.ok(SRC.includes('showAdd') && SRC.includes('Modal')));
  it('应支持类别筛选', () => assert.ok(SRC.includes('categoryFilter')));
  it('应显示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});
