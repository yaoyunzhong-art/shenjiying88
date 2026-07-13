/**
 * health-score/page.test.ts — 健康评分页面测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('health-score — 正例', () => {
  it('应导出 HealthScorePage', () => assert.ok(SRC.includes('export default function HealthScorePage')));
  it('应包含健康评分标题', () => assert.ok(SRC.includes('健康评分')));
  it('应包含维度数据', () => assert.ok(SRC.includes('DIMENSIONS') || SRC.includes('dimension')));
  it('应包含仪表盘进度', () => assert.ok(SRC.includes('Progress')));
  it('应包含综合分计算', () => assert.ok(SRC.includes('overall')));
  it('应包含统计指标', () => assert.ok(SRC.includes('Statistic')));
  it('应包含表格', () => assert.ok(SRC.includes('Table')));
  it('应包含趋势图标', () => assert.ok(SRC.includes('trend') || SRC.includes('📈')));
});
describe('health-score — 反例', () => {
  it('不应包含 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
});
describe('health-score — 边界', () => {
  it('应包含 use client', () => assert.ok(SRC.includes("'use client'")));
  it('应包含评分颜色逻辑', () => assert.ok(SRC.includes('color') || SRC.includes('strokeColor')));
  it('源码长度应大于500', () => assert.ok(SRC.length > 500));
});
