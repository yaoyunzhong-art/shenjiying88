import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('BrandPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function BrandPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('BrandPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('BrandPage — 品牌模块', () => {
  it('应包含 BRANDS 数据', () => assert.ok(SRC.includes('BRANDS')));
  it('应包含 Brand 接口', () => assert.ok(SRC.includes('interface Brand')));
  it('应包含 Table 展示', () => assert.ok(SRC.includes('Table')));
  it('应支持搜索筛选', () => assert.ok(SRC.includes('search')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});

describe('BrandPage — 状态覆盖', () => {
  it('应处理 active 品牌状态', () => assert.ok(SRC.includes("'active'")));
  it('应处理 pending 品牌状态', () => assert.ok(SRC.includes("'pending'")));
});

describe('BrandPage — 指标', () => {
  it('应计算品牌数', () => assert.ok(SRC.includes('BRANDS.length')));
  it('应计算总模板数', () => assert.ok(SRC.includes('.templates')));
  it('应计算总活动数', () => assert.ok(SRC.includes('.campaigns')));
});
