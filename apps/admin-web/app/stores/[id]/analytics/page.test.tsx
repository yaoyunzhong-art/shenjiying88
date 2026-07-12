/**
 * analytics/page.test.tsx — 门店分析看板 L1 冒烟测试
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

describe('analytics — 正例', () => {
  it('应导出一个默认组件 AnalyticsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AnalyticsPage'), '缺少默认导出组件');
  });

  it('应包含 Statistic 营收指标', () => {
    const src = readSource();
    assert.ok(src.includes('今日营收'), '缺少今日营收指标');
  });

  it('应包含客流统计指标', () => {
    const src = readSource();
    assert.ok(src.includes('今日客流'), '缺少今日客流统计');
  });

  it('应包含坪效指标', () => {
    const src = readSource();
    assert.ok(src.includes('坪效'), '缺少坪效指标');
  });
});

// ---- 边界 ----

describe('analytics — 边界', () => {
  it('应包含时段客流分析', () => {
    const src = readSource();
    assert.ok(src.includes('早班') || src.includes('时段客流'), '缺少时段客流分析');
  });

  it('应包含设备使用率分析', () => {
    const src = readSource();
    assert.ok(src.includes('设备使用率'), '缺少设备使用率分析');
  });

  it('应包含支付方式分布', () => {
    const src = readSource();
    assert.ok(src.includes('支付方式'), '缺少支付方式分布');
  });
});

// ---- 防御 ----

describe('analytics — 防御', () => {
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
