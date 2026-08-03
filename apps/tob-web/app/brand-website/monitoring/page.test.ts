/**
 * brand-website/monitoring/page.test.ts — SEO监测看板页测试
 *
 * 覆盖:
 *   L1 正例 — 组件导出、组件委托
 *   L2 安全 — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('MonitoringPage — L1 正例', () => {
  it('应导出一个默认函数组件 MonitoringPage', () => {
    assert.ok(SRC.includes('export default function MonitoringPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应委托给 SEOMonitoringDashboard 组件', () => {
    assert.ok(SRC.includes('SEOMonitoringDashboard'));
  });

  it('SEOMonitoringDashboard 应被正确渲染', () => {
    assert.ok(SRC.includes('<SEOMonitoringDashboard'));
  });

  it('页面应非常简洁，仅含一个组件委托', () => {
    // 仅包含 import、export default 和组件标签
    const lineCount = SRC.split('\n').length;
    assert.ok(lineCount < 20, `预期小于 20 行，实际 ${lineCount} 行`);
  });
});

describe('MonitoringPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});
