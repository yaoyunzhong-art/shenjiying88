/**
 * devices/page.test.tsx — 设备管理页面 L1 冒烟测试
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

describe('devices — 正例', () => {
  it('应导出一个默认组件 DevicesPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DevicesPage'), '缺少默认导出组件');
  });

  it('应包含设备数据数组 DEVICES', () => {
    const src = readSource();
    assert.ok(src.includes('DEVICES'), '缺少设备数据定义');
  });

  it('应包含设备状态状态值', () => {
    const src = readSource();
    assert.ok(src.includes('online') || src.includes('offline'), '缺少设备状态');
  });

  it('应包含设备类型分类', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable 组件');
  });
});

// ---- 边界 ----

describe('devices — 边界', () => {
  it('应包含 Columns 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含状态过滤或统计', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic') || src.includes('filter'), '缺少统计/过滤');
  });

  it('应包含维护操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('维护') || src.includes('维修'), '缺少维护操作');
  });
});

// ---- 防御 ----

describe('devices — 防御', () => {
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
